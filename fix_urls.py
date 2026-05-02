import os
import re

files_to_update = [
    "src/pages/shop-payment-types/CreateShopPaymentType.tsx",
    "src/pages/shop-payment-types/ManageShopPaymentTypes.tsx",
    "src/pages/categories/CreateCategory.tsx",
    "src/pages/menus/CreateMenuItem.tsx",
    "src/pages/menus/CategoryApprovalDetail.tsx",
    "src/pages/menus/components/CategoryApprovalsTab.tsx",
    "src/pages/master-menu-categories/CreateMasterMenuCategory.tsx",
    "src/pages/shop-categories/CreateShopCategory.tsx",
    "src/pages/payment/PaymentMethodForm.tsx",
    "src/pages/item-tags/CreateItemTag.tsx",
    "src/components/TableImage.tsx"
]

def remove_format_image_url(content):
    # Remove imports
    content = re.sub(r'import\s*{\s*([^}]*,\s*)?formatImageUrl(,\s*[^}]*)?\s*}\s*from\s*["\']@/lib/utils["\'];?\n?',
                     lambda m: f'import {{ {m.group(1) or ""}{m.group(2) or ""} }} from "@/lib/utils";\n'.replace('{ ,', '{ ').replace(', }', ' }').replace('{  }', ''), content)
    
    # Remove empty imports
    content = re.sub(r'import\s*{\s*}\s*from\s*["\']@/lib/utils["\'];?\n?', '', content)

    # Replace formatImageUrl(X) with X
    # Using a regex that captures the argument. Need to be careful with nested parentheses but in our case it's mostly formatImageUrl(existingQrUrl) or formatImageUrl(existingImage)
    content = re.sub(r'formatImageUrl\(([^)]+)\)', r'\1', content)
    
    return content

for file_path in files_to_update:
    if not os.path.exists(file_path):
        print(f"Skipping {file_path}, does not exist")
        continue
    with open(file_path, 'r') as f:
        content = f.read()
    
    new_content = remove_format_image_url(content)
    
    with open(file_path, 'w') as f:
        f.write(new_content)
        
    print(f"Updated {file_path}")

