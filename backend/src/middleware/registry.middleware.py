import importlib
from typing import Any, Dict, Type
from src.middleware.base import BaseConnector

class MCPRegistry:
    """
    Registry for managing and instantiating MCP (Model Context Protocol) connectors.
    Connectors are dynamically loaded from src.services.
    """
    
    def __init__(self):
        self._instances: Dict[str, BaseConnector] = {}

    async def get_instance(self, service_name: str, config: Dict[str, Any]) -> BaseConnector:
        """
        Get or create a connector instance for the specified service.
        """
        # Return existing instance if already connected to same config
        # (Simplified: in a real system we might check if config changed)
        if service_name in self._instances:
            return self._instances[service_name]

        # Dynamically import the service module
        # Note: DotNameFinder in src/__init__.py handles the file name mapping
        try:
            module_path = f"src.services.{service_name}"
            module = importlib.import_module(module_path)
            
            # Find the connector class (convention: ServiceNameConnector)
            # Or just look for a subclass of BaseConnector
            connector_class = None
            for attr_name in dir(module):
                attr = getattr(module, attr_name)
                if isinstance(attr, type) and issubclass(attr, BaseConnector) and attr is not BaseConnector:
                    connector_class = attr
                    break
            
            if not connector_class:
                raise ValueError(f"No BaseConnector subclass found in {module_path}")

            # Instantiate and connect
            instance = connector_class(config)
            success = await instance.connect()
            
            if success:
                self._instances[service_name] = instance
                return instance
            else:
                raise ConnectionError(f"Failed to connect to service: {service_name}")

        except ImportError as e:
            raise ImportError(f"Service '{service_name}' not found in src.services. Details: {str(e)}")
        except Exception as e:
            raise RuntimeError(f"Error initializing service '{service_name}': {str(e)}")

# Global registry instance
mcp_registry = MCPRegistry()
