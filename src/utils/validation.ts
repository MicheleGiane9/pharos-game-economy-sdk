import { ethers } from "ethers";

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export function validateTokenName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ValidationError("Token name cannot be empty");
  if (trimmed.length > 64) throw new ValidationError("Token name must be 64 characters or fewer");
  return trimmed;
}

export function validateTokenSymbol(symbol: string): string {
  const trimmed = symbol.trim().toUpperCase();
  if (!/^[A-Z]{1,10}$/.test(trimmed)) {
    throw new ValidationError("Token symbol must be 1–10 uppercase letters");
  }
  return trimmed;
}

export function validateSupply(supplyStr: string): number {
  const value = parseInt(supplyStr, 10);
  if (isNaN(value) || value <= 0) {
    throw new ValidationError("Supply must be a positive integer");
  }
  if (value > 1_000_000_000_000) {
    throw new ValidationError("Supply exceeds the allowed maximum of 1 trillion tokens");
  }
  return value;
}

export function validateAddress(address: string): string {
  if (!ethers.isAddress(address)) {
    throw new ValidationError(`Invalid Ethereum address: ${address}`);
  }
  return ethers.getAddress(address);
}

export function validateRewardAmount(amount: string, fieldName: string): number {
  const value = parseFloat(amount);
  if (isNaN(value) || value < 0) {
    throw new ValidationError(`${fieldName} must be a non-negative number`);
  }
  return value;
}

export function validateNetwork(network: string): "local" | "testnet" | "mainnet" {
  const valid = ["local", "testnet", "mainnet"] as const;
  if (!valid.includes(network as "local" | "testnet" | "mainnet")) {
    throw new ValidationError(`Network must be one of: ${valid.join(", ")}`);
  }
  return network as "local" | "testnet" | "mainnet";
}

export function validateProjectName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) throw new ValidationError("Project name cannot be empty");
  if (!/^[a-zA-Z0-9 _-]+$/.test(trimmed)) {
    throw new ValidationError("Project name must contain only letters, numbers, spaces, hyphens, and underscores");
  }
  return trimmed;
}
