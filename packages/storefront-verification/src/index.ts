import type { HonoModule } from "@voyantjs/hono/module"

import { createStorefrontVerificationPublicRoutes } from "./routes-public.js"
import { storefrontVerificationModule } from "./schema.js"

export type {
  StorefrontVerificationPublicRoutes,
  StorefrontVerificationRoutesOptions,
} from "./routes-public.js"
export { createStorefrontVerificationPublicRoutes } from "./routes-public.js"
export type {
  NewStorefrontVerificationChallenge,
  StorefrontVerificationChallenge,
} from "./schema.js"
export {
  storefrontVerificationChallenges,
  storefrontVerificationChannelEnum,
  storefrontVerificationLinkable,
  storefrontVerificationModule,
  storefrontVerificationStatusEnum,
} from "./schema.js"
export type {
  StorefrontVerificationDeliveryResult,
  StorefrontVerificationEmailSendInput,
  StorefrontVerificationProviderOptions,
  StorefrontVerificationSenders,
  StorefrontVerificationServiceOptions,
  StorefrontVerificationSmsSendInput,
} from "./service.js"
export {
  createStorefrontVerificationSendersFromProviders,
  createStorefrontVerificationService,
  StorefrontVerificationError,
} from "./service.js"
export type {
  ConfirmEmailVerificationChallengeInput,
  ConfirmSmsVerificationChallengeInput,
  StartEmailVerificationChallengeInput,
  StartSmsVerificationChallengeInput,
  StorefrontVerificationChallengeRecord,
  StorefrontVerificationChannel,
  StorefrontVerificationConfirmResult,
  StorefrontVerificationStartResult,
  StorefrontVerificationStatus,
} from "./validation.js"
export {
  confirmEmailVerificationChallengeSchema,
  confirmSmsVerificationChallengeSchema,
  startEmailVerificationChallengeSchema,
  startSmsVerificationChallengeSchema,
  storefrontVerificationChallengeRecordSchema,
  storefrontVerificationChannelSchema,
  storefrontVerificationConfirmResultSchema,
  storefrontVerificationStartResultSchema,
  storefrontVerificationStatusSchema,
} from "./validation.js"

export function createStorefrontVerificationHonoModule(
  options?: Parameters<typeof createStorefrontVerificationPublicRoutes>[0],
): HonoModule {
  return {
    module: storefrontVerificationModule,
    publicRoutes: createStorefrontVerificationPublicRoutes(options),
  }
}
