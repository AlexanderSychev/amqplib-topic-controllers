#/usr/bin/env python3
import os
import argparse

def log(message):
  print("[TEST] " + message)

parser = argparse.ArgumentParser()
parser.add_argument(
  'steps',
  metavar='STEPS',
  type=str,
  nargs='*',
  help='Steps to run'
)

args = parser.parse_args()
run_all = len(args.steps) == 0

if run_all or 'report-dir' in args.steps:
  log('Making report directory...')
  os.system('mkdir -p test-report')
  log('Done.')

if run_all or 'build' in args.steps:
  log('Building library...')
  os.system('make')
  log('Done.')

if run_all or 'containers:up' in args.steps:
  log('Test environment containers running...')
  os.system('docker-compose build && docker-compose up -d')
  log('Done.')

if run_all or 'test' in args.steps:
  log('Running tests...')
  os.system('yarn jest')
  log('Done.')

if run_all or 'containers:down' in args.steps:
  log('Test environment containers stopping...')
  os.system('docker-compose down -v --rmi all')
  log('Done.')
