import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import type {
  GenerateRegistrationOptionsOpts,
  GenerateAuthenticationOptionsOpts,
  VerifiedRegistrationResponse,
  VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { isoBase64URL } from "@simplewebauthn/server/helpers";

const rpName = "Goodie Box Store";
const rpID = process.env.NEXT_PUBLIC_APP_URL?.replace(/https?:\/\//, "").split(":")[0] ?? "localhost";
const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generatePasskeyOptions(userId: string, email: string, name?: string) {
  const authenticators = await db.authenticator.findMany({ where: { userId } });

  const opts: GenerateRegistrationOptionsOpts = {
    rpName,
    rpID,
    userID: userId,
    userName: email,
    userDisplayName: name ?? email,
    excludeCredentials: authenticators.map((a) => ({
      id: isoBase64URL.toBuffer(a.credentialID),
      type: "public-key",
    })),
  };

  return generateRegistrationOptions(opts);
}

export async function verifyPasskeyRegistration(
  userId: string,
  challenge: string,
  response: unknown
): Promise<VerifiedRegistrationResponse | { error: string }> {
  try {
    const verification = await verifyRegistrationResponse({
      response: response as never,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return { error: "Passkey verification failed" };
    }

    const { credentialDeviceType, credentialBackedUp, credentialID, credentialPublicKey, counter } = verification.registrationInfo;

    const responseData = response as { response?: { transports?: string[] } };
    const transports = responseData?.response?.transports?.join(",") ?? null;

    await db.authenticator.create({
      data: {
        credentialID: isoBase64URL.fromBuffer(credentialID),
        userId,
        providerAccountId: userId,
        credentialPublicKey: isoBase64URL.fromBuffer(credentialPublicKey),
        counter,
        credentialDeviceType,
        credentialBackedUp,
        transports,
      },
    });

    return verification;
  } catch (error) {
    logger.error("Passkey registration error", error, { userId });
    return { error: "Passkey verification failed" };
  }
}

export async function generate2FAChallenge(userId: string) {
  const authenticators = await db.authenticator.findMany({ where: { userId } });

  const opts: GenerateAuthenticationOptionsOpts = {
    rpID,
    allowCredentials: authenticators.map((a) => ({
      id: isoBase64URL.toBuffer(a.credentialID),
      type: "public-key",
    })),
  };

  return generateAuthenticationOptions(opts);
}

export async function verify2FAAssertion(
  userId: string,
  challenge: string,
  response: unknown
): Promise<VerifiedAuthenticationResponse | { error: string }> {
  try {
    const authenticator = await db.authenticator.findFirst({ where: { userId } });
    if (!authenticator) return { error: "No passkey registered" };

    const verification = await verifyAuthenticationResponse({
      response: response as never,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      authenticator: {
        credentialID: isoBase64URL.toBuffer(authenticator.credentialID),
        credentialPublicKey: isoBase64URL.toBuffer(authenticator.credentialPublicKey),
        counter: authenticator.counter,
        transports: (authenticator.transports?.split(",").filter(Boolean) ?? undefined) as never,
      },
    });

    if (!verification.verified) {
      return { error: "Passkey verification failed" };
    }

    // Update authenticator counter
    if (verification.authenticationInfo) {
      await db.authenticator.update({
        where: { credentialID: authenticator.credentialID },
        data: { counter: verification.authenticationInfo.newCounter },
      });
    }

    return verification;
  } catch (error) {
    logger.error("2FA verification error", error, { userId });
    return { error: "Passkey verification failed" };
  }
}
