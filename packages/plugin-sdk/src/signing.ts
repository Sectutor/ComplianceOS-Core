import crypto from "crypto"

export function hmacSign(secret: string, message: string) {
  return crypto.createHmac("sha256", secret).update(message).digest("hex")
}

export function verifySignature(secret: string, message: string, signature: string) {
  const expected = hmacSign(secret, message)
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
}
