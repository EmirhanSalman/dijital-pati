"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wallet, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { saveWalletAddress } from "@/app/actions/profile";

interface WalletAddressFormProps {
  currentAddress: string | null | undefined;
}

export default function WalletAddressForm({ currentAddress }: WalletAddressFormProps) {
  const [address, setAddress] = useState(currentAddress || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleConnectWallet = async () => {
    try {
      // @ts-ignore
      if (!window.ethereum) {
        setError("MetaMask bulunamadı! Lütfen MetaMask'ı yükleyin.");
        return;
      }

      // @ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      setAddress(walletAddress);
    } catch (err: any) {
      setError("Cüzdan bağlanırken hata: " + err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await saveWalletAddress(address);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err: any) {
      setError(err.message || "Kayıt sırasında bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div>
        <Label htmlFor="wallet-address">Cüzdan Adresi</Label>
        <div className="flex gap-2 mt-2">
          <Input
            id="wallet-address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="0x..."
            disabled={loading}
            className="font-mono text-sm"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleConnectWallet}
            disabled={loading}
          >
            <Wallet className="h-4 w-4 mr-2" />
            Cüzdan Bağla
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Blockchain adresinizi buraya girin veya MetaMask ile bağlayın
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <CheckCircle2 className="h-4 w-4" />
          <span>Cüzdan adresi başarıyla kaydedildi!</span>
        </div>
      )}

      {currentAddress && (
        <div className="bg-muted px-4 py-3 rounded-lg">
          <p className="text-sm font-medium mb-1">Mevcut Adres:</p>
          <p className="text-xs font-mono text-muted-foreground break-all">
            {currentAddress}
          </p>
        </div>
      )}

      <Button type="submit" disabled={loading || !address.trim()}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Kaydediliyor...
          </>
        ) : (
          "Kaydet"
        )}
      </Button>
    </form>
  );
}
