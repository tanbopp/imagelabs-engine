# Strict Ephemeral S3 Bucket with Automated 1-Day Lifecycle Rule
resource "aws_s3_bucket" "imagelabs_temp" {
  bucket = "imagelabs-temp-${var.environment}"
}

resource "aws_s3_bucket_lifecycle_configuration" "temp_lifecycle" {
  bucket = aws_s3_bucket.imagelabs_temp.id

  rule {
    id     = "auto-delete-temporary-files"
    status = "Enabled"

    expiration {
      days = 1
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_public_access_block" "temp_public_block" {
  bucket = aws_s3_bucket.imagelabs_temp.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "temp_cors" {
  bucket = aws_s3_bucket.imagelabs_temp.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "GET"]
    allowed_origins = ["https://${var.domain_name}"]
    max_age_seconds = 3000
  }
}
