terraform {
  required_version = ">= 1.8.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.50"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ImageLabs"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Ephemeral   = "true"
    }
  }
}
