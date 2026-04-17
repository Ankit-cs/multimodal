import sys
import os
import importlib.abc
import importlib.util

class DotNameFinder(importlib.abc.MetaPathFinder):
    def find_spec(self, fullname, path, target=None):
        if not fullname.startswith("src."):
            return None
        
        parts = fullname.split(".")
        if len(parts) >= 3:
            category = parts[1] # services, routes, utils, middleware
            mod_name = parts[2]
            
            base_dir = os.path.join(os.path.dirname(__file__), category)
            if not os.path.isdir(base_dir):
                return None
            
            if category == "services":
                filename = f"{mod_name.replace('_service', '')}.service.py"
            elif category == "routes":
                filename = f"{mod_name.replace('_routes', '')}.routes.py"
            elif category == "utils":
                filename = f"{mod_name.replace('_utils', '')}.utils.py"
            elif category == "middleware":
                filename = f"{mod_name.replace('_middleware', '')}.middleware.py"
            elif category == "models":
                filename = f"{mod_name.replace('_models', '')}.models.py"
            else:
                return None
                
            filepath = os.path.join(base_dir, filename)
            if os.path.exists(filepath):
                return importlib.util.spec_from_file_location(fullname, filepath)
            
        return None

sys.meta_path.insert(0, DotNameFinder())
