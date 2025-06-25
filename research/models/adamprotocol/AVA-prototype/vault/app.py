#!/usr/bin/env python3
"""
AVA Vault - Constitutional Intelligence Secure Storage & Cryptographic Operations
Handles private keys, constitutional documents, and secure communications
"""

import asyncio
import json
import logging
import time
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import hashlib

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64

from web3 import Web3
from eth_account import Account
from eth_keys import keys
from fastapi import FastAPI, HTTPException, Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import redis.asyncio as redis
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import Column, String, Text, DateTime, Integer, Boolean
from sqlalchemy.orm import declarative_base

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

class VaultItemType(Enum):
    PRIVATE_KEY = "private_key"
    CONSTITUTIONAL_DOCUMENT = "constitutional_document"
    AGENT_CREDENTIAL = "agent_credential"
    GOVERNANCE_VOTE = "governance_vote"
    ENCRYPTED_MESSAGE = "encrypted_message"
    SYSTEM_SECRET = "system_secret"
    VALIDATOR_KEY = "validator_key"

class AccessLevel(Enum):
    PUBLIC = "public"
    RESTRICTED = "restricted"
    CONFIDENTIAL = "confidential"
    TOP_SECRET = "top_secret"
    CONSTITUTIONAL = "constitutional"

class VaultItem(Base):
    __tablename__ = "vault_items"
    
    id = Column(String, primary_key=True)
    item_type = Column(String, nullable=False)
    access_level = Column(String, nullable=False)
    encrypted_data = Column(Text, nullable=False)
    item_metadata = Column(Text)  # Renamed from 'metadata' to avoid SQLAlchemy conflict
    created_at = Column(DateTime, nullable=False)
    accessed_at = Column(DateTime)
    access_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    constitutional_basis = Column(String)

@dataclass
class ConstitutionalVaultItem:
    id: str
    item_type: VaultItemType
    access_level: AccessLevel
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    constitutional_basis: str
    created_at: float
    accessed_at: Optional[float] = None
    access_count: int = 0
    is_active: bool = True

class ConstitutionalVault:
    """Enhanced vault for constitutional intelligence security"""
    
    def __init__(self):
        self.redis_client = None
        self.db_engine = None
        self.session_factory = None
        self.master_key = None
        self.encryption_keys = {}
        self.access_tokens = {}
        
        # Constitutional access control
        self.access_matrix = {
            AccessLevel.PUBLIC: ["read"],
            AccessLevel.RESTRICTED: ["read", "agent"],
            AccessLevel.CONFIDENTIAL: ["read", "write", "validator"],
            AccessLevel.TOP_SECRET: ["read", "write", "council"],
            AccessLevel.CONSTITUTIONAL: ["read", "write", "admin", "constitutional"]
        }
        
    async def initialize(self):
        """Initialize vault systems"""
        try:
            # Connect to Redis
            self.redis_client = redis.from_url("redis://redis:6379")
            
            # Initialize database
            await self.setup_database()
            
            # Initialize encryption
            await self.setup_encryption()
            
            # Load constitutional framework
            await self.load_constitutional_framework()
            
            logger.info("Constitutional Vault initialized")
            
        except Exception as e:
            logger.error(f"Failed to initialize vault: {e}")
            raise

    async def setup_database(self):
        """Setup vault database"""
        try:
            # Create async engine
            database_url = os.getenv("DATABASE_URL", "postgresql+asyncpg://user:password@postgres:5432/ava_vault")
            self.db_engine = create_async_engine(database_url)
            
            # Create session factory
            self.session_factory = sessionmaker(
                self.db_engine, 
                class_=AsyncSession, 
                expire_on_commit=False
            )
            
            # Create tables
            async with self.db_engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
                
            logger.info("Vault database initialized")
            
        except Exception as e:
            logger.error(f"Database setup failed: {e}")
            raise

    async def setup_encryption(self):
        """Setup encryption systems"""
        try:
            # Generate or load master key
            master_key_env = os.getenv("VAULT_MASTER_KEY")
            if master_key_env:
                self.master_key = master_key_env.encode()
            else:
                # Generate new master key
                self.master_key = Fernet.generate_key()
                logger.warning("Generated new master key - store securely!")
            
            # Initialize encryption keys for different access levels
            for access_level in AccessLevel:
                kdf = PBKDF2HMAC(
                    algorithm=hashes.SHA256(),
                    length=32,
                    salt=f"ava_vault_{access_level.value}".encode(),
                    iterations=100000,
                    backend=default_backend()
                )
                key = base64.urlsafe_b64encode(kdf.derive(self.master_key))
                self.encryption_keys[access_level] = Fernet(key)
            
            logger.info("Vault encryption initialized")
            
        except Exception as e:
            logger.error(f"Encryption setup failed: {e}")
            raise

    async def load_constitutional_framework(self):
        """Load constitutional security framework"""
        try:
            # Load constitutional access policies
            constitutional_policies = {
                "private_key_access": {
                    "validator_keys": AccessLevel.CONSTITUTIONAL,
                    "agent_keys": AccessLevel.CONFIDENTIAL,
                    "service_keys": AccessLevel.RESTRICTED
                },
                "document_access": {
                    "constitution": AccessLevel.PUBLIC,
                    "governance_proposals": AccessLevel.RESTRICTED,
                    "internal_communications": AccessLevel.CONFIDENTIAL,
                    "emergency_protocols": AccessLevel.TOP_SECRET
                },
                "vote_access": {
                    "public_votes": AccessLevel.PUBLIC,
                    "validator_votes": AccessLevel.CONFIDENTIAL,
                    "constitutional_votes": AccessLevel.CONSTITUTIONAL
                }
            }
            
            # Store policies in Redis
            await self.redis_client.set(
                "constitutional_security_policies",
                json.dumps(constitutional_policies)
            )
            
            # Initialize system keys
            await self.initialize_system_keys()
            
        except Exception as e:
            logger.error(f"Constitutional framework loading failed: {e}")

    async def initialize_system_keys(self):
        """Initialize system cryptographic keys"""
        try:
            # Generate validator key pair if not exists
            validator_key = await self.get_item("system_validator_key")
            if not validator_key:
                private_key = rsa.generate_private_key(
                    public_exponent=65537,
                    key_size=2048,
                    backend=default_backend()
                )
                
                private_pem = private_key.private_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PrivateFormat.PKCS8,
                    encryption_algorithm=serialization.NoEncryption()
                )
                
                public_key = private_key.public_key()
                public_pem = public_key.public_bytes(
                    encoding=serialization.Encoding.PEM,
                    format=serialization.PublicFormat.SubjectPublicKeyInfo
                )
                
                await self.store_item(ConstitutionalVaultItem(
                    id="system_validator_key",
                    item_type=VaultItemType.VALIDATOR_KEY,
                    access_level=AccessLevel.CONSTITUTIONAL,
                    data={
                        "private_key": private_pem.decode(),
                        "public_key": public_pem.decode(),
                        "key_type": "rsa_2048"
                    },
                    metadata={
                        "purpose": "system_validation",
                        "algorithm": "RSA-2048"
                    },
                    constitutional_basis="System Security Framework - Article 8",
                    created_at=time.time()
                ))
            
            # Generate Ethereum key for blockchain operations
            eth_key = await self.get_item("system_ethereum_key")
            if not eth_key:
                account = Account.create()
                
                await self.store_item(ConstitutionalVaultItem(
                    id="system_ethereum_key",
                    item_type=VaultItemType.PRIVATE_KEY,
                    access_level=AccessLevel.CONSTITUTIONAL,
                    data={
                        "private_key": account.privateKey.hex(),
                        "address": account.address,
                        "key_type": "ethereum"
                    },
                    metadata={
                        "purpose": "blockchain_operations",
                        "network": "ethereum"
                    },
                    constitutional_basis="Blockchain Integration Framework - Article 9",
                    created_at=time.time()
                ))
            
            logger.info("System keys initialized")
            
        except Exception as e:
            logger.error(f"System key initialization failed: {e}")

    async def store_item(self, item: ConstitutionalVaultItem) -> bool:
        """Store item in vault with constitutional security"""
        try:
            # Validate constitutional authorization
            if not await self.validate_constitutional_access(item, "write"):
                raise ValueError("Constitutional authorization failed")
            
            # Encrypt data
            encrypted_data = self.encrypt_data(item.data, item.access_level)
            
            # Store in database
            async with self.session_factory() as session:
                vault_item = VaultItem(
                    id=item.id,
                    item_type=item.item_type.value,                access_level=item.access_level.value,
                    encrypted_data=encrypted_data,
                    item_metadata=json.dumps(item.metadata),
                    created_at=datetime.fromtimestamp(item.created_at),
                    constitutional_basis=item.constitutional_basis,
                    is_active=item.is_active
                )
                
                session.add(vault_item)
                await session.commit()
            
            # Cache metadata in Redis
            await self.redis_client.setex(
                f"vault_meta:{item.id}",
                3600,  # 1 hour TTL
                json.dumps({
                    "id": item.id,
                    "item_type": item.item_type.value,
                    "access_level": item.access_level.value,
                    "metadata": item.metadata,
                    "created_at": item.created_at
                })
            )
            
            # Log vault operation
            await self.log_vault_operation("store", item.id, item.access_level.value)
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to store vault item {item.id}: {e}")
            return False

    async def get_item(self, item_id: str, access_token: Optional[str] = None) -> Optional[ConstitutionalVaultItem]:
        """Retrieve item from vault with access control"""
        try:
            # Get item metadata first
            cached_meta = await self.redis_client.get(f"vault_meta:{item_id}")
            if cached_meta:
                meta = json.loads(cached_meta)
                access_level = AccessLevel(meta["access_level"])
            else:
                # Query database for metadata
                async with self.session_factory() as session:
                    result = await session.get(VaultItem, item_id)
                    if not result or not result.is_active:
                        return None
                    access_level = AccessLevel(result.access_level)
            
            # Validate access
            if not await self.validate_access_token(access_token, access_level):
                raise ValueError("Access denied")
            
            # Retrieve from database
            async with self.session_factory() as session:
                vault_item = await session.get(VaultItem, item_id)
                if not vault_item or not vault_item.is_active:
                    return None
                
                # Decrypt data
                decrypted_data = self.decrypt_data(vault_item.encrypted_data, access_level)
                
                # Update access tracking
                vault_item.accessed_at = datetime.now()
                vault_item.access_count += 1
                await session.commit()
                
                # Create response item
                item = ConstitutionalVaultItem(
                    id=vault_item.id,
                    item_type=VaultItemType(vault_item.item_type),                access_level=access_level,
                    data=decrypted_data,
                    metadata=json.loads(vault_item.item_metadata) if vault_item.item_metadata else {},
                    constitutional_basis=vault_item.constitutional_basis,
                    created_at=vault_item.created_at.timestamp(),
                    accessed_at=vault_item.accessed_at.timestamp() if vault_item.accessed_at else None,
                    access_count=vault_item.access_count,
                    is_active=vault_item.is_active
                )
                
                # Log vault operation
                await self.log_vault_operation("retrieve", item_id, access_level.value)
                
                return item
                
        except Exception as e:
            logger.error(f"Failed to retrieve vault item {item_id}: {e}")
            return None

    def encrypt_data(self, data: Dict[str, Any], access_level: AccessLevel) -> str:
        """Encrypt data with appropriate access level encryption"""
        try:
            json_data = json.dumps(data)
            encrypted = self.encryption_keys[access_level].encrypt(json_data.encode())
            return base64.b64encode(encrypted).decode()
        except Exception as e:
            logger.error(f"Encryption failed: {e}")
            raise

    def decrypt_data(self, encrypted_data: str, access_level: AccessLevel) -> Dict[str, Any]:
        """Decrypt data with appropriate access level decryption"""
        try:
            encrypted_bytes = base64.b64decode(encrypted_data.encode())
            decrypted = self.encryption_keys[access_level].decrypt(encrypted_bytes)
            return json.loads(decrypted.decode())
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            raise

    async def validate_constitutional_access(self, item: ConstitutionalVaultItem, operation: str) -> bool:
        """Validate constitutional access for operations"""
        try:
            # Check constitutional basis
            if not item.constitutional_basis:
                return False
            
            # High-security items require additional validation
            if item.access_level in [AccessLevel.TOP_SECRET, AccessLevel.CONSTITUTIONAL]:
                # Would implement multi-signature validation here
                logger.info(f"High-security access requested for {item.id}")
            
            return True
            
        except Exception as e:
            logger.error(f"Constitutional access validation failed: {e}")
            return False

    async def validate_access_token(self, access_token: Optional[str], required_level: AccessLevel) -> bool:
        """Validate access token for required security level"""
        try:
            if not access_token:
                # Public access
                return required_level == AccessLevel.PUBLIC
            
            # Validate token (simplified - would use proper JWT validation)
            if access_token in self.access_tokens:
                token_data = self.access_tokens[access_token]
                token_level = AccessLevel(token_data["access_level"])
                
                # Check if token level has required permissions
                required_permissions = self.access_matrix[required_level]
                token_permissions = self.access_matrix[token_level]
                
                return any(perm in token_permissions for perm in required_permissions)
            
            return False
            
        except Exception as e:
            logger.error(f"Access token validation failed: {e}")
            return False

    async def generate_access_token(self, identity: str, access_level: AccessLevel, duration_hours: int = 24) -> str:
        """Generate access token for vault operations"""
        try:
            token = str(uuid.uuid4())
            expiry = time.time() + (duration_hours * 3600)
            
            self.access_tokens[token] = {
                "identity": identity,
                "access_level": access_level.value,
                "created_at": time.time(),
                "expires_at": expiry
            }
            
            # Store in Redis with expiry
            await self.redis_client.setex(
                f"vault_token:{token}",
                duration_hours * 3600,
                json.dumps(self.access_tokens[token])
            )
            
            logger.info(f"Generated access token for {identity} with level {access_level.value}")
            return token
            
        except Exception as e:
            logger.error(f"Token generation failed: {e}")
            raise

    async def revoke_access_token(self, token: str) -> bool:
        """Revoke access token"""
        try:
            if token in self.access_tokens:
                del self.access_tokens[token]
            
            await self.redis_client.delete(f"vault_token:{token}")
            return True
            
        except Exception as e:
            logger.error(f"Token revocation failed: {e}")
            return False

    async def sign_data(self, data: Dict[str, Any], key_id: str = "system_validator_key") -> str:
        """Sign data using vault-stored private key"""
        try:
            # Get signing key
            key_item = await self.get_item(key_id)
            if not key_item:
                raise ValueError(f"Signing key {key_id} not found")
            
            # Load private key
            private_key_pem = key_item.data["private_key"]
            private_key = serialization.load_pem_private_key(
                private_key_pem.encode(),
                password=None,
                backend=default_backend()
            )
            
            # Sign data
            data_bytes = json.dumps(data, sort_keys=True).encode()
            signature = private_key.sign(
                data_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return base64.b64encode(signature).decode()
            
        except Exception as e:
            logger.error(f"Data signing failed: {e}")
            raise

    async def verify_signature(self, data: Dict[str, Any], signature: str, key_id: str = "system_validator_key") -> bool:
        """Verify data signature"""
        try:
            # Get verification key
            key_item = await self.get_item(key_id)
            if not key_item:
                return False
            
            # Load public key
            public_key_pem = key_item.data["public_key"]
            public_key = serialization.load_pem_public_key(
                public_key_pem.encode(),
                backend=default_backend()
            )
            
            # Verify signature
            data_bytes = json.dumps(data, sort_keys=True).encode()
            signature_bytes = base64.b64decode(signature.encode())
            
            public_key.verify(
                signature_bytes,
                data_bytes,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            
            return True
            
        except Exception:
            return False

    async def log_vault_operation(self, operation: str, item_id: str, access_level: str):
        """Log vault operation for audit trail"""
        try:
            log_entry = {
                "timestamp": time.time(),
                "operation": operation,
                "item_id": item_id,
                "access_level": access_level,
                "source": "vault_engine"
            }
            
            await self.redis_client.lpush("vault_audit_log", json.dumps(log_entry))
            await self.redis_client.ltrim("vault_audit_log", 0, 99999)  # Keep last 100k logs
            
        except Exception as e:
            logger.error(f"Vault logging failed: {e}")

# FastAPI application
app = FastAPI(title="AVA Vault", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer(auto_error=False)

# Global vault
vault = ConstitutionalVault()

@app.on_event("startup")
async def startup_event():
    """Initialize vault on startup"""
    await vault.initialize()

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "vault_engine": "operational"
    }

@app.post("/auth/token")
async def generate_token(auth_data: Dict[str, Any]):
    """Generate access token"""
    try:
        identity = auth_data["identity"]
        access_level = AccessLevel(auth_data["access_level"])
        duration = auth_data.get("duration_hours", 24)
        
        token = await vault.generate_access_token(identity, access_level, duration)
        
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": duration * 3600,
            "access_level": access_level.value
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.delete("/auth/token")
async def revoke_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Revoke access token"""
    try:
        if not credentials:
            raise HTTPException(status_code=401, detail="No token provided")
        
        success = await vault.revoke_access_token(credentials.credentials)
        return {"revoked": success}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vault/store")
async def store_vault_item(
    item_data: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Store item in vault"""
    try:
        item = ConstitutionalVaultItem(
            id=item_data.get("id", f"vault_{uuid.uuid4()}"),
            item_type=VaultItemType(item_data["item_type"]),
            access_level=AccessLevel(item_data["access_level"]),
            data=item_data["data"],
            metadata=item_data.get("metadata", {}),
            constitutional_basis=item_data["constitutional_basis"],
            created_at=time.time()
        )
        
        success = await vault.store_item(item)
        
        if success:
            return {"status": "stored", "item_id": item.id}
        else:
            raise HTTPException(status_code=500, detail="Storage failed")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/vault/item/{item_id}")
async def get_vault_item(
    item_id: str,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Retrieve item from vault"""
    try:
        token = credentials.credentials if credentials else None
        item = await vault.get_item(item_id, token)
        
        if item:
            return asdict(item)
        else:
            raise HTTPException(status_code=404, detail="Item not found or access denied")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vault/sign")
async def sign_data(
    sign_request: Dict[str, Any],
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Sign data using vault key"""
    try:
        data = sign_request["data"]
        key_id = sign_request.get("key_id", "system_validator_key")
        
        signature = await vault.sign_data(data, key_id)
        
        return {
            "signature": signature,
            "key_id": key_id,
            "timestamp": time.time()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/vault/verify")
async def verify_signature(verify_request: Dict[str, Any]):
    """Verify data signature"""
    try:
        data = verify_request["data"]
        signature = verify_request["signature"]
        key_id = verify_request.get("key_id", "system_validator_key")
        
        is_valid = await vault.verify_signature(data, signature, key_id)
        
        return {
            "valid": is_valid,
            "key_id": key_id,
            "timestamp": time.time()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/vault/audit")
async def get_audit_log(
    limit: int = 100,
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    """Get vault audit log"""
    try:
        logs = await vault.redis_client.lrange("vault_audit_log", 0, limit - 1)
        return [json.loads(log) for log in logs]
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8005)
