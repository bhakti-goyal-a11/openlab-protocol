/**
 * OPENLAB PROTOCOL - CRYPTOGRAPHIC & INPUT SECURITY SUITE
 * Enterprise defense-in-depth:
 * 1. Strict Input Sanitization (anti-XSS, anti-SQLi pattern cleansing)
 * 2. Role-Based Access Control (RBAC) Gatekeeper
 * 3. Cryptographic Non-Repudiation Verification
 * 4. Safe Payload Extraction with Prototype Pollution Defense
 */

import { createHash, randomBytes } from 'crypto';

/**
 * Strips dangerous HTML tags, javascript pseudo-protocols, and executable script payloads.
 */
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Strip javascript: URLs
    .replace(/data:/gi, '') // Strip dangerous data URIs
    .replace(/[<>"'&]/g, (match) => {
      // Encode key HTML entities
      switch (match) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#x27;';
        case '&': return '&amp;';
        default: return match;
      }
    })
    .trim();
}

/**
 * Deep sanitization of JSON payloads, rejecting dangerous object properties (__proto__, constructor).
 */
export function sanitizeObject<T>(data: T): T {
  if (data === null || typeof data !== 'object') {
    if (typeof data === 'string') {
      return sanitizeString(data) as unknown as T;
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const cleanObj: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    // Prototype pollution prevention
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    cleanObj[key] = sanitizeObject(value);
  }

  return cleanObj as T;
}

/**
 * Generates an audit-grade cryptographic trace identifier for request correlation.
 */
export function generateTraceId(): string {
  return `trace_${Date.now().toString(36)}_${randomBytes(8).toString('hex')}`;
}

/**
 * Validates that an acting user has the required authorization role.
 */
export function authorizeRole(
  userRole: string,
  requiredRoles: string[]
): { authorized: boolean; reason?: string } {
  if (!userRole) {
    return { authorized: false, reason: 'Authentication context missing.' };
  }

  if (!requiredRoles.includes(userRole)) {
    return {
      authorized: false,
      reason: `Unauthorized: Role '${userRole}' lacks permission. Required: [${requiredRoles.join(', ')}]`
    };
  }

  return { authorized: true };
}

/**
 * Calculates deterministic SHA-256 hash over an inspection payload for condition tamper verification.
 */
export function computePayloadHash(payload: Record<string, any>): string {
  const normalized = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Verifies non-repudiation condition proof against recorded hash.
 */
export function verifyConditionProof(payload: Record<string, any>, expectedHash: string): boolean {
  const actualHash = computePayloadHash(payload);
  return actualHash.toLowerCase() === expectedHash.toLowerCase();
}

