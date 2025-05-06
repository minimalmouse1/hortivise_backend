enum ResponseMessages {
  // 2xx Success
  OK = 'Request successful',
  CREATED = 'Resource created successfully',
  ACCEPTED = 'Request accepted for processing',
  NO_CONTENT = 'No content to return',

  // 3xx Redirection
  MULTIPLE_CHOICES = 'Multiple options available',
  MOVED_PERMANENTLY = 'Resource moved permanently',
  FOUND = 'Resource found at another location',
  NOT_MODIFIED = 'Resource not modified',
  TEMPORARY_REDIRECT = 'Temporary redirect',
  PERMANENT_REDIRECT = 'Permanent redirect',

  // 4xx Client Errors
  BAD_REQUEST = 'Bad request',
  UNAUTHORIZED = 'Unauthorized access',
  PAYMENT_REQUIRED = 'Payment required',
  FORBIDDEN = 'Access is forbidden',
  NOT_FOUND = 'Resource not found',
  METHOD_NOT_ALLOWED = 'Method not allowed',
  NOT_ACCEPTABLE = 'Request not acceptable',
  CONFLICT = 'Conflict with current state of resource',
  GONE = 'Resource is no longer available',
  LENGTH_REQUIRED = 'Content-Length header required',
  PRECONDITION_FAILED = 'Precondition failed',
  PAYLOAD_TOO_LARGE = 'Payload too large',
  URI_TOO_LONG = 'Request URI too long',
  UNSUPPORTED_MEDIA_TYPE = 'Unsupported media type',
  PRECONDITION_REQUIRED = 'Precondition required',
  TOO_MANY_REQUESTS = 'Too many requests',
  REQUEST_HEADER_FIELDS_TOO_LARGE = 'Request header fields too large',

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 'Internal server error',
  NOT_IMPLEMENTED = 'Not implemented',
  BAD_GATEWAY = 'Bad gateway',
  SERVICE_UNAVAILABLE = 'Service unavailable',
  GATEWAY_TIMEOUT = 'Gateway timeout',
  HTTP_VERSION_NOT_SUPPORTED = 'HTTP version not supported',
}

export default ResponseMessages
