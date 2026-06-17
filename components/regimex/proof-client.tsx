"use client"

import { useMemo, useState } from "react"
import { ExternalLink, Fingerprint, WalletCards } from "lucide-react"
import type { StrategySpec } from "@/lib/regimex/types"
import { buildHashableStrategyJson, buildStrategyJson } from "@/lib/regimex/skill-spec"

declare global {
  interface Window {
    ethereum?: {
      request<T = unknown>(args: { method: string; params?: unknown[] }): Promise<T>
    }
  }
}

const CHAINS = {
  testnet: {
    chainId: "0x61",
    chainName: "BNB Smart Chain Testnet",
    explorer: "https://testnet.bscscan.com/tx/",
    params: {
      chainId: "0x61",
      chainName: "BNB Smart Chain Testnet",
      nativeCurrency: { name: "tBNB", symbol: "tBNB", decimals: 18 },
      rpcUrls: ["https://data-seed-prebsc-1-s1.bnbchain.org:8545/"],
      blockExplorerUrls: ["https://testnet.bscscan.com"],
    },
  },
  mainnet: {
    chainId: "0x38",
    chainName: "BNB Smart Chain",
    explorer: "https://bscscan.com/tx/",
    params: {
      chainId: "0x38",
      chainName: "BNB Smart Chain",
      nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
      rpcUrls: ["https://bsc-dataseed.binance.org/"],
      blockExplorerUrls: ["https://bscscan.com"],
    },
  },
} as const

type WalletTransaction = {
  from?: string
  to?: string
  input?: string
  data?: string
  value?: string
}

function defaultChain(): keyof typeof CHAINS {
  return process.env.NEXT_PUBLIC_DEFAULT_CHAIN === "bsc-mainnet" ? "mainnet" : "testnet"
}

function isHexHash(value: string) {
  return /^0x[a-f0-9]{64}$/i.test(value)
}

function isZeroValue(value: string | undefined) {
  if (!value) return true
  try {
    return BigInt(value) === BigInt(0)
  } catch {
    return false
  }
}

export function ProofClient({ spec }: { spec: StrategySpec }) {
  const [chain, setChain] = useState<keyof typeof CHAINS>(() => defaultChain())
  const [account, setAccount] = useState("")
  const [hash, setHash] = useState(spec.proof.specHash)
  const [txHash, setTxHash] = useState("")
  const [receipt, setReceipt] = useState("")
  const [proofCheck, setProofCheck] = useState("")
  const [status, setStatus] = useState("")
  const json = useMemo(() => buildStrategyJson(spec), [spec])
  const hashPayload = useMemo(() => buildHashableStrategyJson(spec), [spec])

  async function calculateHash() {
    const bytes = new TextEncoder().encode(hashPayload)
    const digest = await crypto.subtle.digest("SHA-256", bytes)
    const hex = Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
    const computed = `0x${hex}`
    setHash(computed)
    setStatus(
      computed.toLowerCase() === spec.proof.specHash.toLowerCase()
        ? "Strategy hash calculated from the canonical payload."
        : "Hash mismatch: the displayed strategy JSON does not match the generated proof hash.",
    )
    return computed
  }

  async function connect() {
    if (!window.ethereum) {
      setStatus("No EIP-1193 wallet detected in this browser.")
      return
    }
    try {
      const accounts = await window.ethereum.request<string[]>({ method: "eth_requestAccounts" })
      const selected = accounts[0] ?? ""
      setAccount(selected)
      setStatus(selected ? "Wallet connected." : "Wallet connection returned no account.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Wallet connection failed.")
    }
  }

  async function switchChain() {
    if (!window.ethereum) return
    const target = CHAINS[chain]
    try {
      await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target.chainId }] })
    } catch (error) {
      await window.ethereum.request({ method: "wallet_addEthereumChain", params: [target.params] })
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: target.chainId }] })
      } catch {
        throw error
      }
    }
  }

  async function anchor() {
    try {
      if (!window.ethereum) {
        setStatus("No wallet detected.")
        return
      }
      const accounts = account ? [account] : await window.ethereum.request<string[]>({ method: "eth_requestAccounts" })
      const from = accounts[0]
      if (!from) {
        setStatus("Connect a wallet first.")
        return
      }
      setAccount(from)
      setReceipt("")
      setProofCheck("")
      await switchChain()
      const data = isHexHash(hash) ? hash : await calculateHash()
      const tx = await window.ethereum.request<string>({
        method: "eth_sendTransaction",
        params: [{ from, to: from, value: "0x0", data }],
      })
      setTxHash(tx)
      setReceipt("Pending confirmation")
      setStatus("Strategy hash submitted to BNB Chain transaction data. Wait for confirmation, then verify the receipt.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "On-chain anchoring failed.")
    }
  }

  async function verifyReceipt() {
    if (!window.ethereum || !txHash) {
      setStatus("Submit or paste a transaction hash first.")
      return
    }
    try {
      const [txReceipt, tx, activeChainId] = await Promise.all([
        window.ethereum.request<Record<string, string> | null>({
          method: "eth_getTransactionReceipt",
          params: [txHash],
        }),
        window.ethereum.request<WalletTransaction | null>({
          method: "eth_getTransactionByHash",
          params: [txHash],
        }),
        window.ethereum.request<string>({ method: "eth_chainId" }),
      ])
      if (!txReceipt) {
        setReceipt("Pending confirmation")
        setStatus("Transaction is not confirmed yet.")
        return
      }

      const input = String(tx?.input || tx?.data || "")
      const expectedHash = isHexHash(hash) ? hash : await calculateHash()

      const blockNumber = txReceipt.blockNumber ? Number.parseInt(txReceipt.blockNumber, 16) : 0
      const success = txReceipt.status === "0x1"
      const calldataMatches = Boolean(expectedHash && input.toLowerCase() === expectedHash.toLowerCase())
      const chainMatches = activeChainId.toLowerCase() === CHAINS[chain].chainId.toLowerCase()
      const selfTransfer = Boolean(tx?.from && tx?.to && tx.from.toLowerCase() === tx.to.toLowerCase())
      const zeroValue = isZeroValue(tx?.value)
      const fromMatchesWallet = !account || !tx?.from || tx.from.toLowerCase() === account.toLowerCase()

      setReceipt(`${success ? "Confirmed" : "Failed"}${blockNumber ? ` in block ${blockNumber}` : ""}`)
      setProofCheck(
        [
          calldataMatches ? "calldata matches strategy hash" : "calldata does not match strategy hash",
          chainMatches ? `${CHAINS[chain].chainName} active` : "wallet is on a different chain",
          zeroValue ? "zero-value transaction" : "transaction value is not zero",
          selfTransfer ? "zero-value self-address proof pattern" : "recipient is not the sender",
          fromMatchesWallet ? "sender matches connected wallet context" : "sender differs from connected wallet",
        ].join(" · "),
      )
      setStatus(
        success && calldataMatches && chainMatches && zeroValue && selfTransfer && fromMatchesWallet
          ? "On-chain proof verified from the connected wallet RPC."
          : "Transaction receipt exists, but at least one proof check needs attention.",
      )
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Receipt verification failed.")
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[420px_1fr]">
      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-[#f3ba2f]">
          <WalletCards className="h-5 w-5" />
        </div>
        <h2 className="mt-5 text-2xl font-light">Anchor the Strategy Hash</h2>
        <p className="mt-2 text-sm leading-6 text-black/45">
          RegimeX hashes the exact generated strategy JSON and sends the hash as transaction calldata to the connected wallet address. That gives judges a reproducible BNB Chain proof without triggering live trades.
        </p>

        <label className="mt-6 block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Network</span>
          <select
            value={chain}
            onChange={(event) => setChain(event.target.value as keyof typeof CHAINS)}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-black/25"
          >
            <option value="testnet">BNB Smart Chain Testnet</option>
            <option value="mainnet">BNB Smart Chain Mainnet</option>
          </select>
        </label>

        <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          <button onClick={connect} className="rounded-xl border border-black/10 px-4 py-3 text-sm text-black/60 transition-colors hover:border-black/20 hover:text-black">
            Connect Wallet
          </button>
          <button onClick={calculateHash} className="rounded-xl border border-black/10 px-4 py-3 text-sm text-black/60 transition-colors hover:border-black/20 hover:text-black">
            Hash Spec
          </button>
          <button onClick={anchor} className="rounded-xl bg-black px-4 py-3 text-sm text-white transition-colors hover:bg-black/80">
            Anchor On-chain
          </button>
          <button onClick={verifyReceipt} className="rounded-xl border border-black/10 px-4 py-3 text-sm text-black/60 transition-colors hover:border-black/20 hover:text-black">
            Verify Receipt
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-[10px] uppercase tracking-[0.16em] text-black/35">Transaction hash</span>
          <input
            value={txHash}
            onChange={(event) => {
              setTxHash(event.target.value.trim())
              setReceipt("")
              setProofCheck("")
            }}
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-xs outline-none transition-colors focus:border-black/25"
            placeholder="0x..."
          />
        </label>

        {status && <p className="mt-4 text-sm leading-6 text-black/45">{status}</p>}
      </section>

      <section className="rounded-2xl border border-black/[0.06] bg-white/65 p-6">
        <div className="grid gap-4">
          <ProofRow label="Spec ID" value={spec.id} />
          <ProofRow label="Strategy Fingerprint" value={spec.strategyFingerprint} />
          <ProofRow label="Wallet" value={account || "Not connected"} />
          <ProofRow label="SHA-256" value={hash || "Not calculated"} />
          <ProofRow label="Transaction" value={txHash || "Not submitted"} />
          <ProofRow label="Receipt" value={receipt || "Not verified"} />
          <ProofRow label="Proof Check" value={proofCheck || "Not verified"} />
        </div>
        {txHash && (
          <a
            href={`${CHAINS[chain].explorer}${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-4 py-3 text-sm text-white transition-colors hover:bg-black/80"
          >
            View on explorer
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
        <div className="mt-6 rounded-2xl bg-black/[0.03] p-5">
          <div className="mb-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-black/35">
            <Fingerprint className="h-4 w-4" />
            Canonical Strategy JSON
          </div>
          <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap text-xs leading-5 text-black/55">{json}</pre>
        </div>
      </section>
    </div>
  )
}

function ProofRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-black/[0.05] pb-4 last:border-b-0">
      <div className="text-[10px] uppercase tracking-[0.16em] text-black/35">{label}</div>
      <div className="mt-2 break-all font-mono text-sm text-black/65">{value}</div>
    </div>
  )
}
