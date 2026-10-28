# Amazon ElastiCache for Redis (In-Memory ephemeral queue and rate limiter only — NO DATABASE)
resource "aws_elasticache_subnet_group" "redis_subnets" {
  name       = "imagelabs-redis-subnets-${var.environment}"
  subnet_ids = [] # Bound to private VPC subnets in target environment
}

resource "aws_security_group" "redis_sg" {
  name        = "imagelabs-redis-sg-${var.environment}"
  description = "Allow inbound Redis traffic from ECS services"

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [] # Bound to ECS task security groups
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "imagelabs-redis-${var.environment}"
  description                = "Ephemeral Redis cluster for BullMQ queues and session limits"
  node_type                  = "cache.t4g.medium"
  num_cache_clusters         = 2
  parameter_group_name       = "default.redis7"
  port                       = 6379
  automatic_failover_enabled = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  subnet_group_name          = aws_elasticache_subnet_group.redis_subnets.name
  security_group_ids         = [aws_security_group.redis_sg.id]

  # Zero persistent disk snapshotting
  snapshot_retention_limit = 0
}
