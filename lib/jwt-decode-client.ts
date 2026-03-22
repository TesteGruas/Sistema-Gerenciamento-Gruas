/**
 * Compat: reexporta a implementação em jwt-payload-browser.
 * Mantido para imports legados e para o grafo do bundler não referenciar módulo inexistente.
 */
export { decodeJwtPayload, normalizeAccessToken } from "./jwt-payload-browser"
