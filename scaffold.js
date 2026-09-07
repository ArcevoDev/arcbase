#!/usr/bin/env node
/**
 * ArcID ↔ Arcbase Integration Scaffold
 * Run: node scaffold-integration.js
 *
 * What this does:
 *  1. Writes the final production arc-id schema (no more changes needed)
 *  2. Writes the final arcbase schema — auth fields removed, arc-id bridge in place
 *  3. Creates src/lib/arcid/ in arcbase — the SDK client arcbase uses to talk to arc-id
 *  4. Creates the Fastify auth-guard for arcbase that verifies arc-id JWTs
 *  5. Creates the identity sync hook — keeps arcbase User in sync with arc-id events
 *
 * INTEGRATION MODEL:
 *  - arc-id runs as a separate Fastify service (port 4000)
 *  - arcbase runs as Next.js (port 3000)
 *  - They share NO database — arc-id owns Identity, arcbase owns User
 *  - The bridge: arcbase User.identityId = arc-id Identity.id (string reference, no FK)
 *  - JWT tokens are issued by arc-id, verified in arcbase using the shared JWT_SECRET
 *  - When a user registers on arcbase, it calls arc-id to create an Identity,
 *    gets back an identityId, and stores it on the arcbase User record
 *
 * WHAT NEVER CHANGES AFTER THIS:
 *  - arc-id schema: frozen — add only new AuditLogAction values via additive migrations
 *  - arcbase User: identityId is the permanent bridge — never rename it
 *  - JWT claim shape: AccessTokenClaims.sub = identityId — all arcbase middleware depends on this
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = __dirname;

function write(rel, content, force = false) {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && !force) {
    console.log(`  SKIP      ${rel}`);
    return;
  }
  fs.writeFileSync(abs, content.trimStart(), "utf8");
  console.log(`  ${force ? "OVERWRITE" : "CREATE   "} ${rel}`);
}

function section(label) {
  console.log(`\n── ${label}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// DETERMINE TARGET DIRS
// The script can run from either the arc-id root or the arcbase root.
// Pass --target=arcid or --target=arcbase to specify, or it writes both
// to sibling directories ../arc-id and ../arcbase relative to CWD.
// ─────────────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const targetArg = args.find(a => a.startsWith("--target="))?.split("=")[1];

const ARCID_ROOT   = targetArg === "arcid"   ? ROOT : path.join(ROOT, "../arc-id");
const ARCBASE_ROOT = targetArg === "arcbase" ? ROOT : path.join(ROOT, "../arcbase");

function arcid(rel, content, force = false) {
  const abs = path.join(ARCID_ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && !force) { console.log(`  [arc-id]  SKIP     ${rel}`); return; }
  fs.writeFileSync(abs, content.trimStart(), "utf8");
  console.log(`  [arc-id]  ${force ? "OVERWRITE" : "CREATE  "} ${rel}`);
}

function arcbase(rel, content, force = false) {
  const abs = path.join(ARCBASE_ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  if (fs.existsSync(abs) && !force) { console.log(`  [arcbase] SKIP     ${rel}`); return; }
  fs.writeFileSync(abs, content.trimStart(), "utf8");
  console.log(`  [arcbase] ${force ? "OVERWRITE" : "CREATE  "} ${rel}`);
}

// ══════════════════════════════════════════════════════════════════════════════
// ARC-ID — FINAL PRODUCTION SCHEMA
// This is the last schema change. Frozen after this migration.
// ══════════════════════════════════════════════════════════════════════════════

const ARCID_SCHEMA = `
// GENERATOR & DATASOURCE
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  output        = "./generated"
  binaryTargets = ["native"]
}

// ==========================================
// ENUMS
// ==========================================

enum MfaType {
  TOTP
  EMAIL
  SMS
}

enum Role {
  ADMIN
  USER
  GUEST
  MEMBER
  CUSTOM
}

enum UserStatus {
  ACTIVE
  INACTIVE
  VERIFIED
  SUSPENDED
  BANNED
  DELETED
  PENDING
}

enum SubscriptionPlan {
  FREE
  PRO
  ENTERPRISE
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELED
  EXPIRED
}

enum TokenType {
  VERIFY_EMAIL
  RESET_PASSWORD
  MAGIC_LINK
}

enum KeyType {
  Ed25519VerificationKey2020
  X25519KeyAgreementKey2020
  JsonWebKey2020
  Multikey
}

enum StatusPurpose {
  REVOCATION
  SUSPENSION
}

enum VcFormat {
  JWT
  SD_JWT
  JSON_LD
  DataIntegrity
}

enum AuditLogAction {
  USER_LOGIN_SUCCESS
  USER_LOGIN_FAILED
  USER_REGISTERED
  PASSWORD_CHANGED
  MFA_ENABLED
  MFA_DISABLED
  MFA_RECOVERY_USED
  TOKEN_REVOKED
  SESSION_CREATED
  SESSION_REVOKED
  PASSKEY_REGISTERED
  PASSKEY_USED
  CREDENTIAL_ISSUED
  CREDENTIAL_REVOKED
  OAUTH_CONSENT_GRANTED
  OAUTH_CONSENT_REVOKED
  TENANT_MEMBER_ADDED
  TENANT_MEMBER_REMOVED
  SIGNING_KEY_CREATED
  SIGNING_KEY_REVOKED
  // Integration events — fired when arc-id notifies consumer apps
  IDENTITY_CREATED
  IDENTITY_SUSPENDED
  IDENTITY_DELETED
}

// ==========================================
// CENTRAL CORE: IDENTITY
// ==========================================

model Identity {
  id            String     @id @default(cuid())
  primaryEmail  String?    @unique
  emailVerified Boolean    @default(false)
  name          String?
  picture       String?
  globalRole    Role       @default(USER)
  status        UserStatus @default(PENDING)
  metadata      Json?
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  localAccount     LocalAccount?
  passkeys         Passkey[]
  mfas             Mfa[]
  mfaRecoveryCodes MfaRecoveryCode[]
  sessions         Session[]
  devices          Device[]
  emailTokens      EmailToken[]

  memberships TenantMembership[]

  dids                DecentralizedIdentifier[] @relation("IdentityDids")
  heldCredentials     VerifiableCredential[]    @relation("CredentialHolder")
  oauthAccounts       OAuthAccount[]
  wallets             Wallet[]
  externalIdentifiers ExternalIdentifier[]

  authorizationCodes AuthorizationCode[]
  accessTokens       AccessToken[]
  refreshTokens      RefreshToken[]
  idTokens           IdToken[]
  oauthConsents      OAuthConsent[]
  legalConsents      LegalConsent[]

  delegationsGranted  AccessDelegation[] @relation("DelegationGrantor")
  delegationsReceived AccessDelegation[] @relation("DelegationGrantee")

  subscriptions Subscription[]
  auditLogs     AuditLog[]

  @@index([primaryEmail])
  @@index([status])
}

// ==========================================
// DECENTRALIZED IDENTIFIER (DID) LAYER
// ==========================================

model DecentralizedIdentifier {
  id         String    @id
  identityId String?
  identity   Identity? @relation("IdentityDids", fields: [identityId], references: [id], onDelete: Cascade)
  tenantId   String?   @unique
  tenant     Tenant?   @relation("TenantDid", fields: [tenantId], references: [id], onDelete: Cascade)

  publicKeyBytes Bytes
  keyType        KeyType
  didDocument    Json
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  issuedCredentials  VerifiableCredential[] @relation("CredentialIssuer")
  subjectCredentials VerifiableCredential[] @relation("CredentialSubject")

  @@index([identityId])
}

// ==========================================
// W3C VERIFIABLE CREDENTIAL MODULE
// ==========================================

model VerifiableCredential {
  id      String   @id
  context Json
  type    Json
  format  VcFormat @default(JWT)

  issuerDid  String
  issuer     DecentralizedIdentifier @relation("CredentialIssuer", fields: [issuerDid], references: [id])
  subjectDid String
  subject    DecentralizedIdentifier @relation("CredentialSubject", fields: [subjectDid], references: [id])

  holderId String?
  holder   Identity? @relation("CredentialHolder", fields: [holderId], references: [id], onDelete: SetNull)

  credentialSubject Json
  proof             Json?

  statusListIndex Int?
  statusListId    String?
  statusList      BitstringStatusList? @relation(fields: [statusListId], references: [id])

  schemaId String?
  schema   CredentialSchema? @relation(fields: [schemaId], references: [id])

  issuedAt  DateTime
  expiresAt DateTime?
  createdAt DateTime  @default(now())

  @@index([holderId])
  @@index([issuerDid])
  @@index([subjectDid])
}

model CredentialSchema {
  id          String                 @id
  type        String                 @default("JsonSchema")
  jsonSchema  Json
  version     String
  createdAt   DateTime               @default(now())
  updatedAt   DateTime               @updatedAt
  credentials VerifiableCredential[]
}

model BitstringStatusList {
  id            String            @id
  type          String            @default("BitstringStatusListEntry")
  statusPurpose StatusPurpose
  encodedList   Bytes
  maxSize       Int               @default(131072)
  issuedCount   Int               @default(0)
  entries       StatusListEntry[]
  credentials   VerifiableCredential[]
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt
}

model StatusListEntry {
  id           String              @id @default(cuid())
  statusListId String
  statusList   BitstringStatusList @relation(fields: [statusListId], references: [id], onDelete: Cascade)
  index        Int
  value        Int
  updatedAt    DateTime            @updatedAt

  @@unique([statusListId, index])
}

// ==========================================
// MULTI-TENANCY & B2B
// ==========================================

model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  sector    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  did               DecentralizedIdentifier? @relation("TenantDid")
  clients           Client[]
  memberships       TenantMembership[]
  projects          Project[]
  policies          TenantPolicy[]
  accessDelegations AccessDelegation[]       @relation("TenantDelegations")
  signingKeys       TenantSigningKey[]
  auditLogs         AuditLog[]

  @@index([slug])
}

model TenantSigningKey {
  id          String    @id @default(cuid())
  tenantId    String
  kid         String    @unique
  privateKey  Bytes
  publicKey   Bytes
  algorithm   String
  kmsProvider String?
  isActive    Boolean   @default(true)
  createdAt   DateTime  @default(now())
  expiresAt   DateTime?

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
  @@index([isActive])
}

model TenantMembership {
  id         String     @id @default(cuid())
  identityId String
  tenantId   String
  tenantRole Role       @default(USER)
  status     UserStatus @default(ACTIVE)
  profile    Json?
  createdAt  DateTime   @default(now())
  updatedAt  DateTime   @updatedAt

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)
  tenant   Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([identityId, tenantId])
  @@index([tenantId])
}

model Project {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model TenantPolicy {
  id            String   @id @default(cuid())
  tenantId      String   @unique
  requireMfa    Boolean  @default(false)
  passwordRules Json?
  loginMethods  Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}

// ==========================================
// AUTHENTICATION SECURITY VECTORS
// ==========================================

model LocalAccount {
  id                String    @id @default(cuid())
  identityId        String    @unique
  email             String    @unique
  passwordHash      String
  passwordAlgorithm String    @default("argon2id")
  passwordUpdatedAt DateTime?
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  identity Identity     @relation(fields: [identityId], references: [id], onDelete: Cascade)
  devices  Device[]     @relation("LocalAccountDevices")
  sessions Session[]    @relation("LocalAccountSessions")
}

model Passkey {
  id           String   @id @default(cuid())
  identityId   String
  credentialId String   @unique
  publicKey    Bytes
  counter      Int      @default(0)
  deviceType   String
  transports   Json?
  backedUp     Boolean  @default(false)
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())
  name         String?  // User-assigned device name: "My iPhone", "YubiKey"

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
}

model Mfa {
  id         String   @id @default(cuid())
  identityId String
  type       MfaType
  secret     String?
  enabled    Boolean  @default(false)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@unique([identityId, type])
}

model MfaRecoveryCode {
  id         String    @id @default(cuid())
  identityId String
  codeHash   String
  used       Boolean   @default(false)
  usedAt     DateTime?
  createdAt  DateTime  @default(now())

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
}

// ==========================================
// OAUTH2 / OIDC PROVIDER LAYER
// ==========================================

model Client {
  id                    String   @id @default(cuid())
  tenantId              String?
  name                  String
  clientId              String
  clientSecret          String?
  grantTypes            Json
  scopes                Json
  public                Boolean  @default(false)
  requirePkce           Boolean  @default(false)
  frontChannelLogoutUri String?
  backChannelLogoutUri  String?
  logoUri               String?
  tosUri                String?
  policyUri             String?
  createdAt             DateTime @default(now())

  tenant        Tenant?             @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  redirectUris  ClientRedirectUri[]
  authCodes     AuthorizationCode[]
  accessTokens  AccessToken[]
  refreshTokens RefreshToken[]
  idTokens      IdToken[]
  oauthConsents OAuthConsent[]

  @@unique([tenantId, clientId])
  @@index([tenantId])
}

model ClientRedirectUri {
  id        String   @id @default(cuid())
  clientId  String
  uri       String
  createdAt DateTime @default(now())

  client Client @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@unique([clientId, uri])
}

model AuthorizationCode {
  id                  String   @id @default(cuid())
  code                String   @unique
  clientId            String
  identityId          String
  redirectUri         String?
  scopes              Json
  nonce               String?
  codeChallenge       String?
  codeChallengeMethod String?
  createdAt           DateTime @default(now())
  expiresAt           DateTime
  consumed            Boolean  @default(false)

  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
  @@index([expiresAt])
}

model AccessToken {
  id         String   @id @default(cuid())
  token      String   @unique
  clientId   String
  identityId String
  scopes     Json
  audience   Json?
  issuedAt   DateTime @default(now())
  expiresAt  DateTime
  revoked    Boolean  @default(false)
  jti        String?  @unique

  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([token, revoked])
  @@index([identityId, clientId])
  @@index([expiresAt])
}

model RefreshToken {
  id         String    @id @default(cuid())
  token      String    @unique
  clientId   String
  identityId String
  sessionId  String?
  issuedAt   DateTime  @default(now())
  expiresAt  DateTime
  rotatedAt  DateTime?
  revoked    Boolean   @default(false)
  rotation   Int       @default(0)

  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([token, revoked])
  @@index([identityId])
  @@index([sessionId])
  @@index([expiresAt])
}

model IdToken {
  id         String   @id @default(cuid())
  jti        String   @unique
  clientId   String
  identityId String
  claims     Json?
  issuedAt   DateTime @default(now())
  expiresAt  DateTime

  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)
  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
  @@index([expiresAt])
}

// ==========================================
// SYSTEM BRIDGES & UTILITIES
// ==========================================

model AccessDelegation {
  id        String    @id @default(cuid())
  grantorId String
  granteeId String
  tenantId  String?
  scopes    Json
  expiresAt DateTime?
  createdAt DateTime  @default(now())

  grantor Identity @relation("DelegationGrantor", fields: [grantorId], references: [id], onDelete: Cascade)
  grantee Identity @relation("DelegationGrantee", fields: [granteeId], references: [id], onDelete: Cascade)
  tenant  Tenant?  @relation("TenantDelegations", fields: [tenantId], references: [id], onDelete: Cascade)
}

model Device {
  id             String   @id @default(cuid())
  identityId     String
  localAccountId String?
  fingerprint    String   @unique
  platform       String?
  browser        String?
  createdAt      DateTime @default(now())
  lastSeenAt     DateTime @default(now())

  identity     Identity      @relation(fields: [identityId], references: [id], onDelete: Cascade)
  localAccount LocalAccount? @relation("LocalAccountDevices", fields: [localAccountId], references: [id])
  sessions     Session[]

  @@index([identityId])
}

model Session {
  id             String   @id @default(cuid())
  identityId     String
  localAccountId String?
  ip             String?
  userAgent      String?
  deviceId       String?
  refreshTokenId String?
  riskSignals    Json?
  createdAt      DateTime @default(now())
  expiresAt      DateTime
  valid          Boolean  @default(true)

  identity     Identity      @relation(fields: [identityId], references: [id], onDelete: Cascade)
  localAccount LocalAccount? @relation("LocalAccountSessions", fields: [localAccountId], references: [id])
  device       Device?       @relation(fields: [deviceId], references: [id])

  @@index([identityId])
  @@index([expiresAt])
  @@index([valid])
}

model OAuthAccount {
  id             String   @id @default(cuid())
  identityId     String
  provider       String
  providerUserId String
  accessToken    String?
  refreshToken   String?
  expiresAt      DateTime?
  linkedAt       DateTime @default(now())

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@unique([provider, providerUserId])
  @@index([identityId])
}

model Wallet {
  id               String   @id @default(cuid())
  identityId       String
  provider         String
  providerWalletId String
  createdAt        DateTime @default(now())

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@unique([provider, providerWalletId])
  @@index([identityId])
}

model ExternalIdentifier {
  id           String   @id @default(cuid())
  identityId   String
  type         String
  valueHash    String
  displayValue String?
  verified     Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@unique([type, valueHash])
  @@index([identityId])
}

model OAuthConsent {
  id         String    @id @default(cuid())
  identityId String
  clientId   String
  scopes     Json
  grantedAt  DateTime  @default(now())
  revokedAt  DateTime?

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)
  client   Client   @relation(fields: [clientId], references: [id], onDelete: Cascade)

  @@index([identityId, clientId])
}

model LegalConsent {
  id         String   @id @default(cuid())
  identityId String
  documentId String
  version    String   @default("1.0")
  acceptedAt DateTime @default(now())

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@unique([identityId, documentId])
}

model EmailToken {
  id         String    @id @default(cuid())
  identityId String
  type       TokenType
  token      String    @unique
  expiresAt  DateTime
  consumed   Boolean   @default(false)
  createdAt  DateTime  @default(now())

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId, type])
  @@index([expiresAt])
}

model Subscription {
  id                 String             @id @default(cuid())
  identityId         String
  plan               SubscriptionPlan   @default(FREE)
  status             SubscriptionStatus @default(ACTIVE)
  externalCustomerId String?            // Stripe/Paddle customer ID
  externalSubId      String?            // Stripe/Paddle subscription ID
  startedAt          DateTime           @default(now())
  endsAt             DateTime?

  identity Identity @relation(fields: [identityId], references: [id], onDelete: Cascade)

  @@index([identityId])
  @@index([status])
}

model AuditLog {
  id         String         @id @default(cuid())
  identityId String?
  tenantId   String?
  actionId   AuditLogAction
  metadata   Json?
  ip         String?
  userAgent  String?
  createdAt  DateTime       @default(now())

  identity Identity? @relation(fields: [identityId], references: [id], onDelete: SetNull)
  tenant   Tenant?   @relation(fields: [tenantId], references: [id], onDelete: SetNull)

  @@index([identityId])
  @@index([tenantId])
  @@index([actionId])
  @@index([createdAt(sort: Desc)])
}

model RevokedJti {
  id        String   @id @default(cuid())
  jti       String   @unique
  revokedAt DateTime @default(now())

  @@index([revokedAt])
}

// ==========================================
// INTEGRATION WEBHOOK OUTBOX
// Arc-id notifies consumer apps (arcbase etc.) of identity lifecycle events
// via this outbox table — processed by a background worker
// ==========================================

model WebhookEvent {
  id          String   @id @default(cuid())
  eventType   AuditLogAction
  identityId  String?
  tenantId    String?
  payload     Json
  targetUrl   String
  attempts    Int      @default(0)
  maxAttempts Int      @default(5)
  deliveredAt DateTime?
  lastError   String?
  createdAt   DateTime @default(now())
  nextRetryAt DateTime @default(now())

  @@index([deliveredAt, nextRetryAt])
  @@index([identityId])
}
`;

// ══════════════════════════════════════════════════════════════════════════════
// ARCBASE — PRODUCTION SCHEMA (auth fields removed, arc-id bridge hardened)
// ══════════════════════════════════════════════════════════════════════════════

const ARCBASE_SCHEMA = `
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  output        = "./generated"
  binaryTargets = ["native"]
}

// ==========================================
// ENUMS
// ==========================================

enum UserRole {
  ADMIN
  MODERATOR
  USER
}

enum UserArchetype {
  STUDENT
  RESEARCHER
  DEVELOPER
  POET
  EDUCATOR
  CREATOR
  THINKER
  BUILDER
  GENERAL
}

enum Visibility {
  PUBLIC
  PRIVATE
  UNLISTED
}

enum ResourceStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  DELETED
}

enum CommentStatus {
  ACTIVE
  HIDDEN
  DELETED
  ARCHIVED
  SPAM
}

enum RelationType {
  RELATED
  REFERENCES
  DEPENDS_ON
  PREREQUISITE
  NEXT
  PREVIOUS
}

enum UsageEvent {
  VIEW
  OPEN
  DOWNLOAD
  SHARE
  LIKE
  BOOKMARK
}

enum ResourceTypeRenderer {
  ARTICLE
  NOTE
  MODULE
  VIDEO
  IMAGE
  FILE
  LINK
  AI_OUTPUT
}

enum ActivityType {
  RESOURCE_CREATED
  RESOURCE_PUBLISHED
  RESOURCE_ARCHIVED
  RESOURCE_DELETED
  COMMENT_POSTED
  COMMENT_DELETED
  COLLECTION_CREATED
  RESOURCE_SAVED
  RESOURCE_UNSAVED
  REACTION_ADDED
  REACTION_REMOVED
  FOLLOW_ADDED
  FOLLOW_REMOVED
  NOTIFICATION_READ
}

enum NotificationType {
  NEW_COMMENT
  NEW_REPLY
  NEW_FOLLOWER
  RESOURCE_PUBLISHED
  RESOURCE_FEATURED
  MENTION
  SYSTEM
}

// ==========================================
// CORE USER — profile only, no auth fields
// Auth lives entirely in arc-id.
// identityId is the permanent immutable bridge.
// ==========================================

model User {
  id          String        @id @default(uuid(7))
  tenantId    String?

  // Bridge to arc-id Identity — set on first login, never changed
  // arc-id Identity.id → arcbase User.identityId
  identityId  String        @unique

  username    String        @unique
  displayName String?
  avatarUrl   String?
  bio         String?
  role        UserRole      @default(USER)
  archetype   UserArchetype @default(GENERAL)

  onboardingStep Int   @default(0)
  onboardingJson Json?
  preferences    Json?
  metadata       Json?

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  archivedAt DateTime?
  deletedAt  DateTime?

  resources      Resource[]
  collections    Collection[]
  comments       Comment[]
  savedResources SavedResource[]
  usageEvents    ResourceUsage[]
  versions       ResourceVersion[]
  activities     Activity[]
  reactions      Reaction[]
  notifications  Notification[]
  following      Follow[]         @relation("Follower")
  followers      Follow[]         @relation("Following")

  @@index([tenantId])
  @@index([identityId])
  @@index([deletedAt])
}

// ==========================================
// KNOWLEDGE GRAPH NODE
// ==========================================

model Resource {
  id                   String               @id @default(uuid(7))
  tenantId             String?
  slug                 String?
  title                String?
  description          String?
  excerpt              String?
  // Canonical content fields — pick one and stick with it
  // publishedContentJson = live, draftContentJson = work in progress
  publishedContentJson Json?
  draftContentJson     Json?
  type                 ResourceTypeRenderer
  status               ResourceStatus       @default(DRAFT)
  visibility           Visibility           @default(PUBLIC)
  category             String?
  language             String               @default("en")
  thumbnailUrl         String?
  coverImageUrl        String?
  fileUrl              String?
  metadata             Json?
  aiMetadata           Json?
  wordCount            Int?
  estimatedTime        Int?

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  publishedAt DateTime?
  archivedAt  DateTime?
  deletedAt   DateTime?

  authorId String
  author   User       @relation(fields: [authorId], references: [id])
  parentId String?
  parent   Resource?  @relation("Hierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children Resource[] @relation("Hierarchy")

  outgoingRelations Relation[] @relation("From")
  incomingRelations Relation[] @relation("To")

  collections  CollectionResource[]
  comments     Comment[]
  metrics      ResourceMetrics?
  versions     ResourceVersion[]
  usageEvents  ResourceUsage[]
  savedBy      SavedResource[]
  resourceTags ResourceTag[]
  reactions    Reaction[]

  @@unique([tenantId, authorId, slug])
  @@index([type, status])
  @@index([tenantId])
  @@index([deletedAt])
  @@index([publishedAt])
  @@index([authorId])
}

// ==========================================
// GRAPH EDGES
// ==========================================

model Relation {
  id        String       @id @default(uuid(7))
  tenantId  String?
  type      RelationType
  fromId    String
  toId      String
  metadata  Json?
  createdAt DateTime     @default(now())

  from Resource @relation("From", fields: [fromId], references: [id], onDelete: Cascade)
  to   Resource @relation("To", fields: [toId], references: [id], onDelete: Cascade)

  @@unique([fromId, toId, type])
  @@index([tenantId, fromId])
  @@index([toId])
}

model ResourceVersion {
  id               String   @id @default(uuid(7))
  tenantId         String?
  resourceId       String
  authorId         String
  versionNumber    Int
  titleSnapshot    String
  contentSnapshot  Json?
  metadataSnapshot Json?
  changeSummary    String?
  createdAt        DateTime @default(now())

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id])

  @@unique([resourceId, versionNumber])
  @@index([tenantId])
  @@index([resourceId])
}

// ==========================================
// CONTAINERS & TAXONOMY
// ==========================================

model Collection {
  id          String     @id @default(uuid(7))
  tenantId    String?
  slug        String
  title       String
  description String?
  visibility  Visibility @default(PUBLIC)
  metadata    Json?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  deletedAt   DateTime?

  authorId String
  author   User   @relation(fields: [authorId], references: [id])

  // Nested collections (series, modules within a course)
  parentId String?
  parent   Collection?  @relation("CollectionHierarchy", fields: [parentId], references: [id])
  children Collection[] @relation("CollectionHierarchy")

  resources CollectionResource[]

  @@unique([tenantId, authorId, slug])
  @@index([tenantId])
  @@index([deletedAt])
  @@index([authorId])
}

model CollectionResource {
  id           String   @id @default(uuid(7))
  tenantId     String?
  collectionId String
  resourceId   String
  orderIndex   Int
  addedAt      DateTime @default(now())

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  resource   Resource   @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([collectionId, resourceId])
  @@index([collectionId, orderIndex])
  @@index([tenantId])
}

model Tag {
  id        String   @id @default(uuid(7))
  tenantId  String?
  name      String
  slug      String
  createdAt DateTime @default(now())

  resources ResourceTag[]

  @@unique([tenantId, slug])
  @@unique([tenantId, name])
  @@index([tenantId])
}

model ResourceTag {
  resourceId String
  tagId      String
  assignedAt DateTime @default(now())

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  tag      Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([resourceId, tagId])
  @@index([tagId])
}

// ==========================================
// ENGAGEMENT
// ==========================================

model Comment {
  id        String        @id @default(uuid(7))
  tenantId  String?
  content   String
  status    CommentStatus @default(ACTIVE)
  metadata  Json?
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
  deletedAt DateTime?

  authorId   String
  resourceId String
  parentId   String?

  author   User      @relation(fields: [authorId], references: [id])
  resource Resource  @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("Thread", fields: [parentId], references: [id], onDelete: Cascade, onUpdate: NoAction)
  replies  Comment[] @relation("Thread")

  @@index([tenantId])
  @@index([resourceId, createdAt])
  @@index([authorId])
}

model SavedResource {
  id         String   @id @default(uuid(7))
  tenantId   String?
  userId     String
  resourceId String
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([userId, resourceId])
  @@index([tenantId])
}

model Reaction {
  id         String   @id @default(uuid(7))
  tenantId   String?
  userId     String
  resourceId String
  type       String   @default("like")
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@unique([userId, resourceId, type])
  @@index([resourceId])
  @@index([tenantId])
}

model Follow {
  id          String   @id @default(uuid(7))
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Follower",  fields: [followerId],  references: [id], onDelete: Cascade)
  following User @relation("Following", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followingId])
}

// ==========================================
// TELEMETRY
// ==========================================

model ResourceUsage {
  id         String     @id @default(uuid(7))
  tenantId   String?
  resourceId String
  actorId    String?
  event      UsageEvent
  sessionId  String?
  metadata   Json?
  createdAt  DateTime   @default(now())

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)
  user     User?    @relation(fields: [actorId], references: [id], onDelete: SetNull)

  @@index([resourceId, event])
  @@index([actorId])
  @@index([tenantId])
  @@index([createdAt])
}

model ResourceMetrics {
  id              String   @id @default(uuid(7))
  tenantId        String?
  resourceId      String   @unique
  views           Int      @default(0)
  opens           Int      @default(0)
  downloads       Int      @default(0)
  shares          Int      @default(0)
  likes           Int      @default(0)
  bookmarks       Int      @default(0)
  comments        Int      @default(0)
  engagementScore Float    @default(0)
  updatedAt       DateTime @updatedAt

  resource Resource @relation(fields: [resourceId], references: [id], onDelete: Cascade)

  @@index([tenantId])
}

model Activity {
  id       String       @id @default(uuid(7))
  tenantId String?
  userId   String?
  type     ActivityType
  entityId String
  metadata Json?
  createdAt DateTime @default(now())

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([entityId])
  @@index([type])
  @@index([tenantId, createdAt])
}

model Notification {
  id         String           @id @default(uuid(7))
  tenantId   String?
  userId     String
  type       NotificationType
  title      String
  body       String?
  entityId   String?
  entityType String?
  read       Boolean          @default(false)
  readAt     DateTime?
  createdAt  DateTime         @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read])
  @@index([tenantId])
  @@index([createdAt])
}
`;

// ══════════════════════════════════════════════════════════════════════════════
// ARC-ID → ARCBASE SDK
// Lives in arcbase at src/lib/arcid/
// This is the ONLY way arcbase talks to arc-id.
// ══════════════════════════════════════════════════════════════════════════════

const ARCID_CLIENT = `
/**
 * ArcID SDK Client for Arcbase
 *
 * This is the integration contract between arcbase and arc-id.
 * All auth operations go through these methods.
 * Never call arc-id endpoints directly from arcbase components or routes —
 * always use this client.
 */

const ARCID_BASE_URL = process.env.ARCID_API_URL ?? "http://localhost:4000";
const ARCID_SERVICE_TOKEN = process.env.ARCID_SERVICE_TOKEN!; // M2M token for server-to-server

type FetchOptions = {
  method?: string;
  body?: unknown;
  token?: string; // user's access token for proxied calls
};

async function arcidFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: options.token
      ? \`Bearer \${options.token}\`
      : \`Bearer \${ARCID_SERVICE_TOKEN}\`,
  };

  const res = await fetch(\`\${ARCID_BASE_URL}\${path}\`, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new ArcIDError(
      err.message ?? "ArcID request failed",
      res.status,
      err.error ?? "ARCID_ERROR"
    );
  }

  return res.json();
}

export class ArcIDError extends Error {
  constructor(message: string, public status: number, public code: string) {
    super(message);
    this.name = "ArcIDError";
  }
}

// ── Identity ──────────────────────────────────────────────────────────────────

export interface ArcIDIdentity {
  id: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  status: string;
  emailVerified: boolean;
  globalRole: string;
  createdAt: string;
}

export interface RegisterResult {
  identity: ArcIDIdentity;
}

export interface LoginResult {
  sessionId: string;
  requiresMfa: boolean;
  mfaTypes: string[];
  accessToken?: string;
  refreshToken?: string;
}

export interface TokenBundle {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type: "Bearer";
  expires_in: number;
}

export const arcid = {
  // ── Registration ────────────────────────────────────────────────────────

  async register(email: string, password: string, name?: string): Promise<RegisterResult> {
    const res = await arcidFetch<{ success: boolean; data: RegisterResult }>(
      "/auth/register",
      { method: "POST", body: { email, password, name } }
    );
    return res.data;
  },

  // ── Login ────────────────────────────────────────────────────────────────

  async login(email: string, password: string): Promise<LoginResult> {
    const res = await arcidFetch<{ success: boolean; data: LoginResult }>(
      "/auth/login",
      { method: "POST", body: { email, password } }
    );
    return res.data;
  },

  // ── MFA ──────────────────────────────────────────────────────────────────

  async verifyMfa(sessionId: string, code: string): Promise<LoginResult> {
    const res = await arcidFetch<{ success: boolean; data: LoginResult }>(
      "/auth/mfa/verify",
      { method: "POST", body: { sessionId, code } }
    );
    return res.data;
  },

  // ── Token operations ─────────────────────────────────────────────────────

  async refreshToken(refreshToken: string): Promise<TokenBundle> {
    return arcidFetch<TokenBundle>("/oauth/token", {
      method: "POST",
      body: {
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: process.env.ARCID_CLIENT_ID!,
      },
    });
  },

  async logout(sessionId: string, accessToken: string): Promise<void> {
    await arcidFetch("/auth/logout", {
      method: "POST",
      body: { sessionId },
      token: accessToken,
    });
  },

  async revokeToken(token: string): Promise<void> {
    await arcidFetch("/oauth/revoke", {
      method: "POST",
      body: {
        token,
        client_id: process.env.ARCID_CLIENT_ID!,
      },
    });
  },

  // ── Identity profile ─────────────────────────────────────────────────────

  async getIdentity(accessToken: string): Promise<ArcIDIdentity> {
    const res = await arcidFetch<{ success: boolean; data: ArcIDIdentity }>(
      "/identity/me",
      { token: accessToken }
    );
    return res.data;
  },

  async updateIdentity(
    accessToken: string,
    data: { name?: string; picture?: string }
  ): Promise<ArcIDIdentity> {
    const res = await arcidFetch<{ success: boolean; data: ArcIDIdentity }>(
      "/identity/me",
      { method: "PATCH", body: data, token: accessToken }
    );
    return res.data;
  },

  // ── Password ─────────────────────────────────────────────────────────────

  async requestPasswordReset(email: string): Promise<void> {
    await arcidFetch("/auth/password/reset", {
      method: "POST",
      body: { email },
    });
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<void> {
    await arcidFetch("/auth/password/reset/confirm", {
      method: "POST",
      body: { token, newPassword },
    });
  },

  // ── Email verification ────────────────────────────────────────────────────

  async verifyEmail(token: string): Promise<void> {
    await arcidFetch("/auth/email/verify", {
      method: "POST",
      body: { token },
    });
  },

  // ── Token introspection (server-to-server) ────────────────────────────────

  async introspect(token: string): Promise<{ active: boolean; sub?: string; scope?: string }> {
    return arcidFetch("/oauth/introspect", {
      method: "POST",
      body: { token },
    });
  },
};
`;

const ARCID_JWT_VERIFY = `
import { jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.ARCID_JWT_SECRET!);

export interface ArcIDTokenPayload extends JWTPayload {
  sub: string;       // arc-id Identity.id
  jti: string;
  scope: string;
  aud: string[];
  tid?: string;      // tenantId
}

/**
 * Verifies an arc-id access token locally using the shared JWT_SECRET.
 * This avoids a network round-trip to arc-id on every request.
 * Use arcid.introspect() only when you need to check revocation status.
 */
export async function verifyArcIDToken(token: string): Promise<ArcIDTokenPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    issuer: process.env.ARCID_ISSUER ?? "arcid",
  });
  return payload as ArcIDTokenPayload;
}

/**
 * Extracts the identityId from a Bearer token header without throwing.
 * Returns null on any failure — use for optional auth.
 */
export async function extractIdentityId(authHeader: string | null): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyArcIDToken(authHeader.slice(7));
    return payload.sub;
  } catch {
    return null;
  }
}
`;

const ARCID_MIDDLEWARE = `
import { NextRequest, NextResponse } from "next/server";
import { verifyArcIDToken } from "./jwt";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma-client";

export interface AuthContext {
  identityId: string;
  tenantId: string | null;
  scope: string[];
  user: User | null;    // null for M2M tokens or first-login
}

/**
 * Extracts and verifies the arc-id JWT from the request.
 * Loads the arcbase User record matching the identityId.
 *
 * Returns null if no valid token is present (unauthenticated).
 * Throws on malformed / expired tokens (let the error boundary handle it).
 */
export async function getAuthContext(req: NextRequest): Promise<AuthContext | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const payload = await verifyArcIDToken(authHeader.slice(7));

  const user = await prisma.user.findUnique({
    where: { identityId: payload.sub },
  });

  return {
    identityId: payload.sub,
    tenantId: payload.tid ?? null,
    scope: (payload.scope ?? "").split(" ").filter(Boolean),
    user,
  };
}

/**
 * Route handler wrapper — enforces authentication.
 * Injects AuthContext into the handler.
 *
 * Usage:
 *   export const GET = withAuth(async (req, ctx) => {
 *     return NextResponse.json({ userId: ctx.user?.id })
 *   })
 */
type AuthedHandler = (req: NextRequest, ctx: AuthContext) => Promise<NextResponse>;

export function withAuth(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }
    return handler(req, ctx);
  };
}

/**
 * Like withAuth but also ensures the arcbase User record exists.
 * If the identity has no User record yet (first login after registration),
 * it creates one automatically.
 */
export function withUser(handler: AuthedHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const ctx = await getAuthContext(req);
    if (!ctx) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (!ctx.user) {
      // First login — provision arcbase User from arc-id identity
      // Username defaults to the identity ID prefix until user sets one
      ctx.user = await prisma.user.create({
        data: {
          identityId: ctx.identityId,
          username: \`user_\${ctx.identityId.slice(0, 8)}\`,
          tenantId: ctx.tenantId,
        },
      });
    }

    return handler(req, ctx);
  };
}

/**
 * Scope guard — ensures the token has a specific OAuth scope.
 */
export function withScope(requiredScope: string, handler: AuthedHandler) {
  return withAuth(async (req, ctx) => {
    if (!ctx.scope.includes(requiredScope)) {
      return NextResponse.json(
        { success: false, error: "FORBIDDEN", message: \`Scope '\${requiredScope}' required\` },
        { status: 403 }
      );
    }
    return handler(req, ctx);
  });
}
`;

const ARCID_SYNC_WEBHOOK = `
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Arc-id → Arcbase webhook handler.
 * Mounted at: POST /api/webhooks/arcid
 *
 * Arc-id sends lifecycle events (IDENTITY_SUSPENDED, IDENTITY_DELETED etc.)
 * via its WebhookEvent outbox. This handler keeps arcbase User in sync.
 *
 * Secured by HMAC-SHA256 signature verification.
 */

const WEBHOOK_SECRET = process.env.ARCID_WEBHOOK_SECRET!;

function verifySignature(body: string, signature: string): boolean {
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  try {
    return timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(\`sha256=\${expected}\`)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-arcid-signature") ?? "";

  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { eventType: string; identityId?: string; payload: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  switch (event.eventType) {
    case "IDENTITY_SUSPENDED":
    case "IDENTITY_DELETED": {
      if (event.identityId) {
        await prisma.user.updateMany({
          where: { identityId: event.identityId },
          data: { deletedAt: new Date() },
        });
      }
      break;
    }

    case "USER_REGISTERED": {
      // arc-id notifies us of new registrations so we can pre-provision User
      // This is optional — withUser() above also handles lazy provisioning
      if (event.identityId) {
        const existing = await prisma.user.findUnique({
          where: { identityId: event.identityId },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              identityId: event.identityId,
              username: \`user_\${event.identityId.slice(0, 8)}\`,
            },
          });
        }
      }
      break;
    }

    default:
      // Unknown event — ignore, return 200 so arc-id doesn't retry
      break;
  }

  return NextResponse.json({ received: true });
}
`;

const ARCID_ENV_ADDITIONS = `
# ─────────────────────────────────────────
# ArcID Integration (add to arcbase .env)
# ─────────────────────────────────────────

# URL of your arc-id Fastify server
ARCID_API_URL="http://localhost:4000"

# Must match JWT_SECRET in arc-id .env exactly
ARCID_JWT_SECRET="same_value_as_arc_id_JWT_SECRET"

# OIDC client registered in arc-id for arcbase
ARCID_CLIENT_ID="arcbase"

# M2M service token — issued via client_credentials grant from arc-id
# Generate with: curl -X POST http://localhost:4000/oauth/token \\
#   -d grant_type=client_credentials \\
#   -d client_id=arcbase \\
#   -d client_secret=your_secret
ARCID_SERVICE_TOKEN=""

# Issuer claim in arc-id JWTs (default: "arcid")
ARCID_ISSUER="arcid"

# Webhook signing secret — set the same value in arc-id WebhookEvent config
ARCID_WEBHOOK_SECRET="generate_with_openssl_rand_hex_32"
`;

const ARCBASE_AUTH_FLOW_EXAMPLE = `
/**
 * Example: arcbase register flow updated to use arc-id
 * src/app/api/auth/register/route.ts
 *
 * Before: created LocalAccount, hashed password, stored in arcbase DB
 * After:  delegates to arc-id, gets identityId back, creates arcbase User
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { arcid, ArcIDError } from "@/lib/arcid/client";

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12),
  username: z.string().min(3).max(30).regex(/^[a-z0-9_]+$/),
  displayName: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = RegisterSchema.parse(body);

    // Step 1 — Create Identity in arc-id
    const { identity } = await arcid.register(input.email, input.password, input.displayName);

    // Step 2 — Check username not taken in arcbase
    const usernameTaken = await prisma.user.findUnique({
      where: { username: input.username },
    });
    if (usernameTaken) {
      return NextResponse.json(
        { success: false, error: "CONFLICT", message: "Username is already taken" },
        { status: 409 }
      );
    }

    // Step 3 — Provision arcbase User with the identityId bridge
    const user = await prisma.user.create({
      data: {
        identityId: identity.id,
        username: input.username,
        displayName: input.displayName,
      },
    });

    return NextResponse.json({ success: true, data: { userId: user.id } }, { status: 201 });
  } catch (err) {
    if (err instanceof ArcIDError) {
      return NextResponse.json(
        { success: false, error: err.code, message: err.message },
        { status: err.status }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "VALIDATION_ERROR", issues: err.flatten().fieldErrors },
        { status: 422 }
      );
    }
    return NextResponse.json(
      { success: false, error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}
`;

const ARCBASE_LOGIN_FLOW_EXAMPLE = `
/**
 * Example: arcbase login flow updated to use arc-id
 * src/app/api/auth/login/route.ts
 *
 * arc-id issues the tokens. arcbase just passes them through to the client.
 * The client stores the access token and sends it with every request.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { arcid, ArcIDError } from "@/lib/arcid/client";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const { email, password } = LoginSchema.parse(await req.json());

    const result = await arcid.login(email, password);

    if (result.requiresMfa) {
      return NextResponse.json({
        success: true,
        data: {
          requiresMfa: true,
          sessionId: result.sessionId,
          mfaTypes: result.mfaTypes,
        },
      });
    }

    // Tokens issued — return them directly to client
    return NextResponse.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        sessionId: result.sessionId,
      },
    });
  } catch (err) {
    if (err instanceof ArcIDError) {
      return NextResponse.json(
        { success: false, error: err.code, message: err.message },
        { status: err.status }
      );
    }
    return NextResponse.json({ success: false, error: "INTERNAL_SERVER_ERROR" }, { status: 500 });
  }
}
`;

// ══════════════════════════════════════════════════════════════════════════════
// EXECUTE
// ══════════════════════════════════════════════════════════════════════════════

console.log("╔══════════════════════════════════════════════════╗");
console.log("║     ArcID ↔ Arcbase Integration Scaffold         ║");
console.log("╚══════════════════════════════════════════════════╝");

section("Arc-ID — Final production schema (FROZEN after this migration)");
arcid("prisma/schema.prisma", ARCID_SCHEMA, true);

section("Arcbase — Production schema (auth fields removed)");
arcbase("prisma/schema.prisma", ARCBASE_SCHEMA, true);

section("Arcbase — Arc-ID SDK client");
arcbase("src/lib/arcid/client.ts",   ARCID_CLIENT);
arcbase("src/lib/arcid/jwt.ts",      ARCID_JWT_VERIFY);
arcbase("src/lib/arcid/middleware.ts", ARCID_MIDDLEWARE);
arcbase("src/lib/arcid/index.ts", `
// Arc-ID integration barrel — import from here, not from individual files
export { arcid, ArcIDError } from "./client";
export type { ArcIDIdentity, LoginResult, RegisterResult, TokenBundle } from "./client";
export { verifyArcIDToken, extractIdentityId } from "./jwt";
export { getAuthContext, withAuth, withUser, withScope } from "./middleware";
export type { AuthContext } from "./middleware";
`);

section("Arcbase — Webhook sync handler");
arcbase("src/app/api/webhooks/arcid/route.ts", ARCID_SYNC_WEBHOOK);

section("Arcbase — Updated auth route examples");
arcbase("src/app/api/auth/register/route.ts", ARCBASE_AUTH_FLOW_EXAMPLE, true);
arcbase("src/app/api/auth/login/route.ts",    ARCBASE_LOGIN_FLOW_EXAMPLE, true);

section("Arcbase — .env additions");
arcbase(".env.arcid.example", ARCID_ENV_ADDITIONS);

console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Integration scaffold complete.                              ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  ARC-ID SCHEMA — FROZEN                                      ║
║  Run once and never touch again:                             ║
║    cd arc-id                                                 ║
║    pnpm prisma migrate dev --name final-production-schema    ║
║    psql $DATABASE_URL -f prisma/migrations/manual/           ║
║                         client_global_unique.sql             ║
║                                                              ║
║  ARCBASE SCHEMA — FROZEN                                     ║
║  Auth fields removed. Run migration:                         ║
║    cd arcbase                                                ║
║    pnpm prisma migrate dev --name remove-auth-add-social     ║
║                                                              ║
║  INTEGRATION SETUP (one-time):                               ║
║  1. Start arc-id: cd arc-id && pnpm dev:api                  ║
║  2. Register arcbase as a client in arc-id:                  ║
║     POST http://localhost:4000/oauth/clients                 ║
║     { clientId: "arcbase", grantTypes: ["authorization_code",║
║       "refresh_token"], scopes: ["openid","profile","email"] }║
║  3. Get a service token for arcbase:                         ║
║     POST http://localhost:4000/oauth/token                   ║
║     grant_type=client_credentials&client_id=arcbase          ║
║  4. Copy values to arcbase .env (see .env.arcid.example)     ║
║  5. Register webhook: POST http://localhost:4000/webhooks     ║
║     { targetUrl: "http://localhost:3000/api/webhooks/arcid", ║
║       secret: ARCID_WEBHOOK_SECRET }                         ║
║                                                              ║
║  IMMUTABLE CONTRACT (never change these):                    ║
║  • arcbase User.identityId = arc-id Identity.id              ║
║  • JWT claim: sub = identityId                               ║
║  • ARCID_JWT_SECRET must be identical in both .env files     ║
╚══════════════════════════════════════════════════════════════╝
`);