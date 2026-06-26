from huggingface_hub import HfApi

api = HfApi()

print("Starting upload to Hugging Face...")
api.upload_folder(
    folder_path=".",
    repo_id="Awaisj9878/leafdoc-backend",
    repo_type="space",
    ignore_patterns=["venv/*", ".venv/*", "__pycache__/*", "*.pyc", "outputs/*", ".env", ".git/*", "models/*"]
)
print("Upload complete!")
