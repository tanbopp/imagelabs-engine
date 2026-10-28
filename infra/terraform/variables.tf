variable "aws_region" {
  type        = string
  default     = "us-east-1"
  description = "AWS deployment region"
}

variable "environment" {
  type        = string
  default     = "production"
  description = "Deployment environment name"
}

variable "domain_name" {
  type        = string
  default     = "imagelabs.dev"
  description = "Apex domain name for CloudFront and Route53"
}
