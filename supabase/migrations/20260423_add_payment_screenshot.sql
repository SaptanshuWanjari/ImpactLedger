-- Migration: add payment_screenshot_url to donations table
-- This stores the public URL of the payment screenshot uploaded by the donor.

ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS payment_screenshot_url text;
