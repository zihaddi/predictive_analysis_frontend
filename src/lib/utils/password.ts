/** Single source of truth for password rules — used by the UI checklist and by server actions. */
export const PASSWORD_RULES = [
	{ id: 'length', test: (password: string) => password.length >= 8 },
	{ id: 'special', test: (password: string) => /[^A-Za-z0-9\s]/.test(password) },
	{ id: 'number', test: (password: string) => /\d/.test(password) }
] as const;

export type PasswordRuleId = (typeof PASSWORD_RULES)[number]['id'];

export function evaluatePassword(password: string) {
	return PASSWORD_RULES.map((rule) => ({ id: rule.id, met: rule.test(password) }));
}

export function isPasswordValid(password: string) {
	return PASSWORD_RULES.every((rule) => rule.test(password));
}
