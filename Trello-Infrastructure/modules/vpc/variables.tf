variable "vpc_cidr_block" {
  description = "CIDR block for the VPC"
  type        = string
}

variable "vpc_name" {
  description = "Name for the VPC"
  type        = string
}

variable "public_subnet_count" {
  description = "Number of public subnets to create"
  type        = number
}

variable "private_subnet_count" {
  description = "Number of private subnets to create"
  type        = number
}

variable "public_subnet_name_prefix" {
  description = "Prefix for public subnet names"
  type        = string
}

variable "private_subnet_name_prefix" {
  description = "Prefix for private subnet names"
  type        = string
}

variable "igw_name" {
  description = "Name for the internet gateway"
  type        = string
}

variable "public_route_table_name" {
  description = "Name for the public route table"
  type        = string
}
