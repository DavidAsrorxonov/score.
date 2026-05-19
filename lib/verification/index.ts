export { VERIFICATION_CONFIG } from "./config";
export { getVerificationMessage, VERIFICATION_MESSAGES } from "./errors";
export { requestForVerification } from "./http-client";
export { verifyTarget } from "./verify-target";
export type {
  RedirectHop,
  VerificationErrorCode,
  VerificationFailure,
  VerificationHttpResponse,
  VerificationResult,
  VerificationSuccess,
} from "./types";
