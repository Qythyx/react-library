import { t as translate } from 'i18next';

export enum HttpStatus {
	// Success
	OK = 200,
	CREATED = 201,
	NO_CONTENT = 204,

	// Client Errors
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	PRECONDITION_FAILED = 412,
	UNPROCESSABLE_ENTITY = 422,

	// Server Errors
	INTERNAL_SERVER_ERROR = 500,
	NOT_IMPLEMENTED = 501,
	BAD_GATEWAY = 502,
	SERVICE_UNAVAILABLE = 503,
}

export function getStatusMessage(
	t: typeof translate,
	status: HttpStatus,
	defaultMessage: string | undefined,
): string | undefined {
	switch (status) {
		case HttpStatus.NOT_FOUND:
			return t('errors.notFound');
		case HttpStatus.UNAUTHORIZED:
			return t('errors.unauthorized');
		default:
			return defaultMessage;
	}
}
