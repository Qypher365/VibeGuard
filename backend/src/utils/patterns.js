const patterns = [
  {
    type: 'aws_access_key_id',
    regex: /\bAKIA[0-9A-Z]{16}\b/g,
    description: 'AWS Access Key ID (starts with AKIA, 20 chars total)',
  },
  {
    type: 'aws_secret_access_key',
    regex: /(?:aws_secret_access_key|secret[_-]?access[_-]?key)\s*[:=]\s*['"]([A-Za-z0-9/+=]{40})['"]/gi,
    description: 'AWS Secret Access Key assigned to a variable (40-char base64-like string)',
  },
  {
    type: 'openai_api_key',
    regex: /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/g,
    description: 'OpenAI-style API key (sk- or sk-proj- prefix)',
  },
  {
    type: 'mongodb_uri',
    regex: /\bmongodb(?:\+srv)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi,
    description: 'MongoDB connection URI with embedded credentials',
  },
  {
    type: 'postgres_uri',
    regex: /\bpostgres(?:ql)?:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi,
    description: 'PostgreSQL connection URI with embedded credentials',
  },
  {
    type: 'mysql_uri',
    regex: /\bmysql:\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/gi,
    description: 'MySQL connection URI with embedded credentials',
  },
  {
    type: 'redis_uri',
    regex: /\bredis:\/\/(?:[^\s'"]*:)?[^\s'"]*@[^\s'"]+/gi,
    description: 'Redis connection URI with embedded credentials',
  },
  {
    type: 'generic_api_key_assignment',
    regex: /\b(?:api[_-]?key|apikey)\s*[:=]\s*['"]([A-Za-z0-9_\-./+=]{16,})['"]/gi,
    description: 'Generic api_key / apiKey variable assignment',
  },
  {
    type: 'generic_token_assignment',
    regex: /\b(?:token|access[_-]?token|auth[_-]?token)\s*[:=]\s*['"]([A-Za-z0-9_\-./+=]{16,})['"]/gi,
    description: 'Generic token / access_token variable assignment',
  },
  {
    type: 'generic_password_assignment',
    regex: /\b(?:password|passwd|pwd)\s*[:=]\s*['"]([^'"]{4,})['"]/gi,
    description: 'Generic password / passwd / pwd variable assignment',
  },
  {
    type: 'github_token',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr|github_pat)_[A-Za-z0-9_]{20,}\b/g,
    description: 'GitHub personal access token or fine-grained PAT',
  },
  {
    type: 'slack_token',
    regex: /\bxox[baprs]-[0-9A-Za-z-]{10,}\b/g,
    description: 'Slack bot/user/app token',
  },
  {
    type: 'stripe_key',
    regex: /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/g,
    description: 'Stripe secret API key (live or test)',
  },
  {
    type: 'google_api_key',
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    description: 'Google API key',
  },
  {
    type: 'jwt',
    regex: /\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    description: 'JSON Web Token (header.payload.signature)',
  },
  {
    type: 'private_key_block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----[\s\S]+?-----END (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/g,
    description: 'PEM-formatted private key block',
  },
];

export { patterns };
export default patterns;