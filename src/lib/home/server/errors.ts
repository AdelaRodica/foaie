export type HomeErrorKind = "unauthenticated" | "permission" | "unexpected";

type HomeErrorOptions = Readonly<{
  operation?: string;
  cause?: unknown;
}>;

const messages: Record<HomeErrorKind, string> = {
  unauthenticated: "Debes iniciar sesión para continuar.",
  permission: "No tienes permiso para consultar este Inicio.",
  unexpected: "No se ha podido cargar tu Inicio.",
};

export class HomeError extends Error {
  readonly kind: HomeErrorKind;
  readonly operation?: string;

  constructor(kind: HomeErrorKind, options: HomeErrorOptions = {}) {
    super(messages[kind], { cause: options.cause });
    this.name = "HomeError";
    this.kind = kind;
    this.operation = options.operation;
  }
}

export function mapHomeReadError(
  error: Readonly<{ code?: string | null }>,
  operation: string,
) {
  return new HomeError(error.code === "42501" ? "permission" : "unexpected", {
    operation,
    cause: error,
  });
}
