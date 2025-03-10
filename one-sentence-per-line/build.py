#!/usr/bin/env python3
import subprocess
import sys

def run_command(cmd, shell=True):
    print("Running command:", " ".join(cmd))
    result = subprocess.run(cmd, shell=shell)
    if result.returncode != 0:
        print(f"Error: Command {' '.join(cmd)} failed with exit code {result.returncode}.")
        sys.exit(result.returncode)
    else:
        print(f"Command {' '.join(cmd)} executed successfully.\n")

if __name__ == "__main__":
    # Step 1: Install dependencies
    run_command(["npm.cmd", "install"])
    
    # Step 2: Compile the extension
    run_command(["npm.cmd", "run", "compile"])
    
    # Step 3: Package the extension using npx
    run_command(["npx.cmd", "vsce", "package"])
    
    print("VSIX package created successfully.")
