# ECS Fargate Cluster and Services for Web, API, and Queue Workers
resource "aws_ecs_cluster" "main" {
  name = "imagelabs-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Task Execution IAM Role
resource "aws_iam_role" "ecs_execution_role" {
  name = "imagelabs-ecs-execution-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution_policy" {
  role       = aws_iam_role.ecs_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task Role (Scoped only to S3 temp bucket)
resource "aws_iam_role" "ecs_task_role" {
  name = "imagelabs-ecs-task-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "s3_scoped_policy" {
  name = "imagelabs-s3-scoped-${var.environment}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${aws_s3_bucket.imagelabs_temp.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "task_s3_attachment" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = aws_iam_policy.s3_scoped_policy.arn
}
