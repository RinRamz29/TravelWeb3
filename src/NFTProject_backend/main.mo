/**
 * Module     : main.mo
 * Copyright  : 2025 ReSky
 * License    : Apache 2.0 with LLVM Exception
 * Maintainer : ReSky
 * Stability  : Experimental
 */

/**
    NOTICE
    Historical Places NFT is built on the foundation of Itoka NFT, 
    which itself is built on Rocklabs' ic-NFT.
    Original source: https://github.com/rocklabs-io/ic-nft
 */

import HashMap "mo:base/HashMap";
import Cycles "mo:base/ExperimentalCycles";
import Principal "mo:base/Principal";
import Error "mo:base/Error";
import Option "mo:base/Option";
import Nat "mo:base/Nat";
import Int "mo:base/Int";
import Hash "mo:base/Hash";
import Text "mo:base/Text";
import List "mo:base/List";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import TrieSet "mo:base/TrieSet";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Prelude "mo:base/Prelude";
import Debug "mo:base/Debug";
import Buffer "mo:base/Buffer";
import Types "./types";

shared(msg) actor class HistoricalPlaceToken(
    _logo: Text,
    _name: Text, 
    _symbol: Text,
    _desc: Text,
    _owner: Principal,
    _transcationFee: ?Nat
    ) = this {

    // NFT attributes and functionalities
    type Metadata = Types.Metadata;
    type TokenMetadata = Types.TokenMetadata;
    type Record = Types.Record;
    type TxRecord = Types.TxRecord;
    type Operation = Types.Operation;
    type TokenInfo = Types.TokenInfo;
    type TokenInfoExt = Types.TokenInfoExt;
    type UserInfo = Types.UserInfo;
    type UserInfoExt = Types.UserInfoExt;

    public type Errors = {
        #Unauthorized;
        #TokenNotExist;
        #InvalidOperator;
    };
    
    // to be compatible with Rust canister
    // in Rust, Result is `Ok` and `Err`
    public type TxReceipt = {
        #Ok: Nat;
        #Err: Errors;
    };

    public type MintResult = {
        #Ok: (Nat, Nat);
        #Err: Errors;
    };

    private stable var logo_ : Text = _logo; // base64 encoded image
    private stable var name_ : Text = _name;
    private stable var symbol_ : Text = _symbol;
    private stable var desc_ : Text = _desc;
    private stable var owner_: Principal = _owner;
    
    private stable var custodiansEntries : [Principal] = [];
    private var custodians = TrieSet.empty<Principal>();
    custodians := TrieSet.put(custodians, owner_, Principal.hash(owner_), Principal.equal);
    
    private stable var totalSupply_: Nat = 0;
    private stable var blackhole: Principal = Principal.fromText("aaaaa-aa");
    private stable var tokensEntries : [(Nat, TokenInfo)] = [];
    private stable var usersEntries : [(Principal, UserInfo)] = [];
    private stable var txs: [TxRecord] = [];

    // Each TokenInfo contains idx, who is the owner, metadata, operator, and time
    private var tokens = HashMap.HashMap<Nat, TokenInfo>(1, Nat.equal, Hash.hash);    
    // Each UserInfo contains who can operate like owner, who approve the operators, which tokens can be operated
    private var users = HashMap.HashMap<Principal, UserInfo>(1, Principal.equal, Principal.hash);
    private stable var txIndex: Nat = 0;

    private func Array_append<T>(xs:[T],ys:[T]):[T]{
        let zs : Buffer.Buffer<T> = Buffer.Buffer(xs.size()+ys.size());
        for (x in xs.vals()) {
            zs.add(x);
        };
        for (y in ys.vals()) {
            zs.add(y);
        };
        return zs.toArray();
    };

    private func addTxRecord(
        caller: Principal, op: Operation, tokenIndex: ?Nat,
        from: Record, to: Record, timestamp: Time.Time
    ): Nat {
        let record: TxRecord = {
            caller = caller;
            op = op;
            index = txIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        txs := Array_append(txs, [record]);
        txIndex += 1;
        return txIndex - 1;
    };

    private func _unwrap<T>(x : ?T) : T =
    switch x {
      case null { Prelude.unreachable() };
      case (?x_) { x_ };
    };
    
    private func _exists(tokenId: Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return true; };
            case _ { return false; };
        }
    };

    private func _ownerOf(tokenId: Nat) : ?Principal {
        switch (tokens.get(tokenId)) {
            case (?info) { return ?info.owner; };
            case (_) { return null; };
        }
    };

    private func _isOwner(who: Principal, tokenId: Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return info.owner == who; };
            case _ { return false; };
        };
    };

    private func _isApproved(who: Principal, tokenId: Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return info.operator == ?who; };
            case _ { return false; };
        }
    };
    
    private func _balanceOf(who: Principal) : Nat {
        switch (users.get(who)) {
            case (?user) { return TrieSet.size(user.tokens); };
            case (_) { return 0; };
        }
    };

    private func _newUser() : UserInfo {
        {
            var operators = TrieSet.empty<Principal>();
            var allowedBy = TrieSet.empty<Principal>();
            var allowedTokens = TrieSet.empty<Nat>();
            var tokens = TrieSet.empty<Nat>();
        }
    };

    private func _tokenInfotoExt(info: TokenInfo) : TokenInfoExt {
        return {
            index = info.index;
            owner = info.owner;
            metadata = info.metadata;
            timestamp = info.timestamp;
            operator = info.operator;
        };
    };

    private func _userInfotoExt(info: UserInfo) : UserInfoExt {
        return {
            operators = TrieSet.toArray(info.operators);
            allowedBy = TrieSet.toArray(info.allowedBy);
            allowedTokens = TrieSet.toArray(info.allowedTokens);
            tokens = TrieSet.toArray(info.tokens);
        };
    };

    private func _isApprovedOrOwner(spender: Principal, tokenId: Nat) : Bool {
        switch (_ownerOf(tokenId)) {
            case (?owner) {
                return spender == owner or _isApproved(spender, tokenId) or _isApprovedForAll(owner, spender);
            };
            case _ {
                return false;
            };
        };        
    };

    private func _getApproved(tokenId: Nat) : ?Principal {
        switch (tokens.get(tokenId)) {
            case (?info) {
                return info.operator;
            };
            case (_) {
                return null;
            };
        }
    };

    //if operator can operate all of owner's NFT
    private func _isApprovedForAll(owner: Principal, operator: Principal) : Bool {
        switch (users.get(owner)) {
            case (?user) {
                return TrieSet.mem(user.operators, operator, Principal.hash(operator), Principal.equal);
            };
            case _ { return false; };
        };
    };

    // if the the owner is the new users, make a new empty UserInfo and add the current token to the user.tokens; 
    // Or directly add to existing users map
    private func _addTokenTo(to: Principal, tokenId: Nat) {
        switch(users.get(to)) {
            case (?user) {
                user.tokens := TrieSet.put(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(to, user);
            };
            case _ {
                let user = _newUser();
                user.tokens := TrieSet.put(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(to, user);
            };
        }
    }; 

    private func _removeTokenFrom(owner: Principal, tokenId: Nat) {
        assert(_exists(tokenId) and _isOwner(owner, tokenId));
        switch(users.get(owner)) {
            case (?user) {
                user.tokens := TrieSet.delete(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(owner, user);
            };
            case _ {
                assert(false);
            };
        }
    };
   
    private func _clearApproval(owner: Principal, tokenId: Nat) {
        assert(_exists(tokenId) and _isOwner(owner, tokenId));
        switch (tokens.get(tokenId)) {
            case (?info) {
                if (info.operator != null) {
                    let op = _unwrap(info.operator);// get the token's operator
                    let opInfo = _unwrap(users.get(op));// get operator's information
                    opInfo.allowedTokens := TrieSet.delete(opInfo.allowedTokens, tokenId, Hash.hash(tokenId), Nat.equal);
                    users.put(op, opInfo);
                    info.operator := null;
                    tokens.put(tokenId, info);
                }
            };
            case _ {
                assert(false);
            };
        }
    };  

    private func _transfer(to: Principal, tokenId: Nat) {
        assert(_exists(tokenId));
        switch(tokens.get(tokenId)) {
            case (?info) {
                _removeTokenFrom(info.owner, tokenId);
                _addTokenTo(to, tokenId);
                info.owner := to;
                tokens.put(tokenId, info);
            };
            case (_) {
                assert(false);
            };
        };
    };

    private func _burn(owner: Principal, tokenId: Nat) {
        _clearApproval(owner, tokenId);
        _transfer(blackhole, tokenId);
    };

    public shared(msg) func mint(to: Principal, metadata: ?TokenMetadata): async MintResult {
        // The only one who can mint NFT must be the owner or custodians
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        
        let token: TokenInfo = {
            index = totalSupply_;
            var owner = to;
            var metadata = metadata;
            var operator = null;
            timestamp = Time.now();
        };

        tokens.put(totalSupply_, token);
        _addTokenTo(to, totalSupply_);
        totalSupply_ += 1;
        let txid = addTxRecord(msg.caller, #mint(metadata), ?token.index, #user(blackhole), #user(to), Time.now());
        return #Ok((token.index, txid));
    };

    public shared(msg) func burn(tokenId: Nat): async TxReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        if(_isOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };
        _burn(msg.caller, tokenId);
        let txid = addTxRecord(msg.caller, #burn, ?tokenId, #user(msg.caller), #user(blackhole), Time.now());
        return #Ok(txid);
    };

    public shared(msg) func setTokenMetadata(tokenId: Nat, new_metadata: TokenMetadata) : async TxReceipt {
        // only canister owner can set
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        let token = _unwrap(tokens.get(tokenId));
        let old_metadate = token.metadata;
        token.metadata := ?new_metadata;
        tokens.put(tokenId, token);
        let txid = addTxRecord(msg.caller, #setMetadata, ?token.index, #metadata(old_metadate), #metadata(?new_metadata), Time.now());
        return #Ok(txid);
    };

    public shared(msg) func approve(tokenId: Nat, operator: Principal) : async TxReceipt {
        // Check if the token exists
        var owner: Principal = switch (_ownerOf(tokenId)) {
            case (?own) {
                own;
            };
            case (_) {
                return #Err(#TokenNotExist)
            }
        };

        // Only owner and operator can use approve
        if(Principal.equal(msg.caller, owner) == false)
            if(_isApprovedForAll(owner, msg.caller) == false)
                return #Err(#Unauthorized);
        
        // the operator should not be owner
        if(owner == operator) {
            return #Err(#InvalidOperator);
        };

        // Update the new operator to the token
        switch (tokens.get(tokenId)) {
            case (?info) {
                info.operator := ?operator;
                tokens.put(tokenId, info);
            };
            case _ {
                return #Err(#TokenNotExist);
            };
        };

        switch (users.get(operator)) {
            case (?user) {
                user.allowedTokens := TrieSet.put(user.allowedTokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(operator, user);
            };
            case _ {
                let user = _newUser();
                user.allowedTokens := TrieSet.put(user.allowedTokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(operator, user);
            };
        };
        let txid = addTxRecord(msg.caller, #approve, ?tokenId, #user(msg.caller), #user(operator), Time.now());
        return #Ok(txid);
    };

    // set a operator can manage all of the owner's assets
    public shared(msg) func setApprovalForAll(operator: Principal, value: Bool): async TxReceipt {
        if(msg.caller == operator) {
            return #Err(#Unauthorized);
        };
        var txid = 0;
        if value {
            let caller = switch (users.get(msg.caller)) {
                case (?user) { user };
                case _ { _newUser() };
            };
            caller.operators := TrieSet.put(caller.operators, operator, Principal.hash(operator), Principal.equal);
            users.put(msg.caller, caller);
            let user = switch (users.get(operator)) {
                case (?user) { user };
                case _ { _newUser() };
            };
            user.allowedBy := TrieSet.put(user.allowedBy, msg.caller, Principal.hash(msg.caller), Principal.equal);
            users.put(operator, user);
            txid := addTxRecord(msg.caller, #approveAll, null, #user(msg.caller), #user(operator), Time.now());
        } else {
            switch (users.get(msg.caller)) {
                case (?user) {
                    user.operators := TrieSet.delete(user.operators, operator, Principal.hash(operator), Principal.equal);    
                    users.put(msg.caller, user);
                };
                case _ { };
            };
            switch (users.get(operator)) {
                case (?user) {
                    user.allowedBy := TrieSet.delete(user.allowedBy, msg.caller, Principal.hash(msg.caller), Principal.equal);    
                    users.put(operator, user);
                };
                case _ { };
            };
            txid := addTxRecord(msg.caller, #revokeAll, null, #user(msg.caller), #user(operator), Time.now());
        };
        return #Ok(txid);
    };

    //only owner can use transfer
    public shared(msg) func transfer(to: Principal, tokenId: Nat): async TxReceipt {
        var owner: Principal = switch (_ownerOf(tokenId)) {
            case (?own) {
                own;
            };
            case (_) {
                return #Err(#TokenNotExist)
            }
        };

        if (owner != msg.caller) {
            return #Err(#Unauthorized);
        };

        _clearApproval(msg.caller, tokenId);
        _transfer(to, tokenId);
        let txid = addTxRecord(msg.caller, #transfer, ?tokenId, #user(msg.caller), #user(to), Time.now());
        return #Ok(txid);
    };

    //owner and operator can use transferFrom
    public shared(msg) func transferFrom(from: Principal, to: Principal, tokenId: Nat): async TxReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        if(_isApprovedOrOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };
        _clearApproval(from, tokenId);
        _transfer(to, tokenId);
        let txid = addTxRecord(msg.caller, #transferFrom, ?tokenId, #user(from), #user(to), Time.now());
        return #Ok(txid);
    };

    // public query function 
    public query func logo(): async Text {
        return logo_;
    };

    public query func name(): async Text {
        return name_;
    };

    public query func symbol(): async Text {
        return symbol_;
    };

    public query func desc(): async Text {
        return desc_;
    };

    public query func balanceOf(who: Principal): async Nat {
        return _balanceOf(who);
    };

    public query func totalSupply(): async Nat {
        return totalSupply_;
    };

    // get metadata about this NFT collection
    public query func getMetadata(): async Metadata {
        {
            logo = logo_;
            name = name_;
            symbol = symbol_;
            desc = desc_;
            totalSupply = totalSupply_;
            owner = owner_;
            cycles = Cycles.balance();
            custodians = TrieSet.toArray(custodians);
            created_at = created_at;
            upgraded_at = upgraded_at;
        }
    };

    public query func isApprovedForAll(owner: Principal, operator: Principal) : async Bool {
        return _isApprovedForAll(owner, operator);
    };

    public query func getOperator(tokenId: Nat) : async Principal {
        switch (_exists(tokenId)) {
            case true {
                switch (_getApproved(tokenId)) {
                    case (?who) {
                        return who;
                    };
                    case (_) {
                        return Principal.fromText("aaaaa-aa");
                    };
                }   
            };
            case (_) {
                throw Error.reject("token not exist")
            };
        }
    };

    public query func getUserInfo(who: Principal) : async UserInfoExt {
        switch (users.get(who)) {
            case (?user) {
                return _userInfotoExt(user)
            };
            case _ {
                throw Error.reject("unauthorized");
            };
        };        
    };

    public query func getUserTokens(owner: Principal) : async [TokenInfoExt] {
        let tokenIds = switch (users.get(owner)) {
            case (?user) {
                TrieSet.toArray(user.tokens)
            };
            case _ {
                []
            };
        };
        var ret: [TokenInfoExt] = [];
        for(id in Iter.fromArray(tokenIds)) {
            ret := Array_append(ret, [_tokenInfotoExt(_unwrap(tokens.get(id)))]);
        };
        return ret;
    };

    public query func ownerOf(tokenId: Nat): async Principal {
        switch (_ownerOf(tokenId)) {
            case (?owner) {
                return owner;
            };
            case _ {
                throw Error.reject("token not exist")
            };
        }
    };

    public query func getTokenInfo(tokenId: Nat) : async TokenInfoExt {
        switch(tokens.get(tokenId)){
            case(?tokeninfo) {
                return _tokenInfotoExt(tokeninfo);
            };
            case(_) {
                throw Error.reject("token not exist");
            };
        };
    };

    // Optional
    public query func getAllTokens() : async [TokenInfoExt] {
        Iter.toArray(Iter.map(tokens.entries(), func (i: (Nat, TokenInfo)): TokenInfoExt {_tokenInfotoExt(i.1)}))
    };

    public query func getAllHolders(): async [Principal] {
        let temp:[Principal] = Iter.toArray(Iter.map(tokens.entries(), func (i: (Nat, TokenInfo)): Principal {_tokenInfotoExt(i.1).owner}));
        return TrieSet.toArray(TrieSet.fromArray(temp,Principal.hash,Principal.equal));
    };

    public query func historySize(): async Nat {
        return txs.size();
    };

    public query func getTransaction(index: Nat): async TxRecord {
        return txs[index];
    };

    public query func getTransactions(start: Nat, limit: Nat): async [TxRecord] {
        var res: [TxRecord] = [];
        var i = start;
        while (i < start + limit and i < txs.size()) {
            res := Array_append(res, [txs[i]]);
            i += 1;
        };
        return res;
    };

    public query func getUserTransactionAmount(user: Principal): async Nat {
        var res: Nat = 0;
        for (i in txs.vals()) {
            if (i.caller == user or i.from == #user(user) or i.to == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    public query func getUserTransactions(user: Principal, start: Nat, limit: Nat): async [TxRecord] {
        var res: [TxRecord] = [];
        var idx = 0;
        label l for (i in txs.vals()) {
            if (i.caller == user or i.from == #user(user) or i.to == #user(user)) {
                if(idx < start) {
                    idx += 1;
                    continue l;
                };
                if(idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };
 
    // **********************************************
    // ******** Historical Places Protocol **********
    // ********************Begin*********************
    type PhotoLocation = Types.PhotoLocation;
    type DocumentLocation = Types.DocumentLocation;
    type DecryptionKey = Types.DecryptionKey;
    type UpgradeHistory = Types.UpgradeHistory;
    
    private stable var accessHistory: [TxRecord] = [];
    private stable var contentSetupHistory: [TxRecord] = [];
    private stable var upgradeHistory: [TxRecord] = [];

    private stable var accessIndex: Nat = 0;
    private stable var contentSetupIndex: Nat = 0;
    private stable var upgradeIndex: Nat = 0;

    private stable var created_at: Time.Time = Time.now();
    private var upgraded_at: Time.Time = Time.now();

    private stable var decryptionKeyEntries : [(Nat, DecryptionKey)] = [];
    private stable var photoSrcEntires : [(Nat, Text)] = [];
    private stable var thumbnailSrcEntires : [(Nat, Text)] = [];
    private stable var documentSrcEntires : [(Nat, Text)] = [];

    private var decryptionKeys = HashMap.HashMap<Nat, DecryptionKey>(1, Nat.equal, Hash.hash);
    private var photoSrc = HashMap.HashMap<Nat, Text>(1, Nat.equal, Hash.hash);
    private var thumbnailSrc = HashMap.HashMap<Nat, Text>(1, Nat.equal, Hash.hash);
    private var documentSrc = HashMap.HashMap<Nat, Text>(1, Nat.equal, Hash.hash);

    // Transaction fee placeholder
    private stable var transcationFee_ : Nat = 0;
    switch _transcationFee {
      case null { transcationFee_ := 0 };
      case (?_transcationFee) { transcationFee_ := _transcationFee };
    };

    public type CustodianSetupReceipt = {
        #Ok: Text;
        #Err: Text;
    };

    public type ContentSetupReceipt = {
        #Ok: (Nat, Text);
        #Err: Errors;
    };

    public type DecryptionKeyReceipt = {
        #Ok: ?DecryptionKey;
        #Err: Errors;
    };

    public type AccessReceipt = {
        #Ok: AccessResult;
        #Err: Errors;
    };

    public type AccessResult = {
        #ContentSrc: ?Text;
        #AccessTimes: Nat;
    };

    private func _isAnonymous(caller: Principal): Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"))
    };

    private func _isCustodian(principal: Principal): Bool {
        return TrieSet.mem(custodians, principal, Principal.hash(principal), Principal.equal);
    };

    //For upgrade automatic recording
    private func _commit(_message: Text) {
        let upgradeHistory: UpgradeHistory = {
            message = _message;
            upgrade_time = upgraded_at;
        };

        let txid = addUpgradeRecord(owner_, #upgrade, null, #user(owner_), #commit(upgradeHistory), upgraded_at);  
    };
    
    private func addAccessRecord(
        caller: Principal, op: Operation, tokenIndex: ?Nat,
        from: Record, to: Record, timestamp: Time.Time
    ): Nat {
        let record: TxRecord = {
            caller = caller;
            op = op;
            index = accessIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        accessHistory := Array_append(accessHistory, [record]);
        accessIndex += 1;
        return accessIndex - 1;
    };

    private func addContentSetupRecord(
        caller: Principal, op: Operation, tokenIndex: ?Nat,
        from: Record, to: Record, timestamp: Time.Time
    ): Nat {
        let record: TxRecord = {
            caller = caller;
            op = op;
            index = contentSetupIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        contentSetupHistory := Array_append(contentSetupHistory, [record]);
        contentSetupIndex += 1;
        return contentSetupIndex - 1;
    };

    private func addUpgradeRecord(
        caller: Principal, op: Operation, tokenIndex: ?Nat,
        from: Record, to: Record, timestamp: Time.Time
    ): Nat {
        let record: TxRecord = {
            caller = caller;
            op = op;
            index = upgradeIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        upgradeHistory := Array_append(upgradeHistory, [record]);
        upgradeIndex += 1;
        return upgradeIndex - 1;
    };

    //Upgrade management. The controllers and custodians are highly encourage to commit a short description for recent upgrade.   
    public shared(msg) func commit(_message: Text) : async ContentSetupReceipt {
        // only canister owner can upgrade
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        let upgradeHistoryEntry: UpgradeHistory = {
            message = _message;
            upgrade_time = upgraded_at;
        };

        let txid = addUpgradeRecord(msg.caller, #upgrade, null, #user(msg.caller), #commit(upgradeHistoryEntry), Time.now());  
        return #Ok((txid, _message));
    };
 
    //Custodians management
    public shared(msg) func addCustodian(new_custodian: Principal) : async CustodianSetupReceipt {
        if(not _isCustodian(msg.caller)){
            return #Err("Unauthorized");
        } else if(_isCustodian(new_custodian)) {
            return #Err("The object has already existed");
        } else {
            custodians := TrieSet.put(custodians, new_custodian, Principal.hash(new_custodian), Principal.equal);
            return #Ok(Principal.toText(new_custodian));
        }
    };

    public shared(msg) func removeCustodian(removed_custodian: Principal) : async CustodianSetupReceipt {
        if(not _isCustodian(msg.caller)){
            return #Err("Unauthorized");
        } else if(not _isCustodian(removed_custodian)) {
            return #Err("The object does not exist");
        } else {
            custodians := TrieSet.delete(custodians, removed_custodian, Principal.hash(removed_custodian), Principal.equal);
            return #Ok(Principal.toText(removed_custodian));
        }
    };

    //only canister owner can set
    public shared(msg) func setTranscationFee(_transcationFee: Nat): async TxReceipt {
        if(not _isCustodian(msg.caller)){
            return #Err(#Unauthorized);
        };
        let old_transcationFee = transcationFee_;
        transcationFee_ := _transcationFee;
        let txid = addTxRecord(msg.caller, #setTranscationFee, null, #transcationFee(old_transcationFee), #transcationFee(transcationFee_), Time.now());
        return #Ok(txid);
    };

    //Set up content sources
    public shared(msg) func setPhotoSrc(tokenId: Nat, src: Text) : async ContentSetupReceipt {
        // only canister owner can set
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };

        let source: Text = src;
        let token = _unwrap(tokens.get(tokenId));
        photoSrc.put(tokenId, source);

        let txid = addContentSetupRecord(msg.caller, #setPhotoSrc, ?token.index, #secret(""), #secret(""), Time.now());  
        return #Ok((txid, "#setPhotoSrc"));
    };

    public shared(msg) func setThumbnailSrc(tokenId: Nat, src: Text) : async ContentSetupReceipt {
        // only canister owner can set
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };

        let source: Text = src;
        let token = _unwrap(tokens.get(tokenId));
        thumbnailSrc.put(tokenId, source);

        let txid = addContentSetupRecord(msg.caller, #setThumbnailSrc, ?token.index, #secret(""), #secret(""), Time.now());  
        return #Ok((txid, "#setThumbnailSrc"));
    };

    public shared(msg) func setDocumentSrc(tokenId: Nat, src: Text) : async ContentSetupReceipt {
        // only canister owner can set
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };

        let source: Text = src;
        let token = _unwrap(tokens.get(tokenId));
        documentSrc.put(tokenId, source);

        let txid = addContentSetupRecord(msg.caller, #setDocumentSrc, ?token.index, #secret(""), #secret(""), Time.now());  
        return #Ok((txid, "#setDocumentSrc"));
    };

    //Set decryption key to decode encrypted files 
    public shared(msg) func setDecryptionKey(tokenId: Nat, _iv: Text, _privateKey: Text) : async ContentSetupReceipt {
        // only canister owner can set
        if(not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        let decryptionKey: DecryptionKey = {
            iv = _iv; 
            privateKey = _privateKey;
        };
        let token = _unwrap(tokens.get(tokenId));
        decryptionKeys.put(tokenId, decryptionKey);

        let txid = addContentSetupRecord(msg.caller, #setDecryptionKey, ?token.index, #secret(""), #secret(""), Time.now());  
        return #Ok((txid, "#setDecryptionKey"));
    };

    // [Retrival functions] Retrival functions are not getter query functions, since retrival operation will make record and written on blockchain.
    // Thumbnail retrival - available to anyone
    public shared(msg) func retriveThumbnailSrc(tokenId: Nat, viewer: Principal) : async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };

        let token = _unwrap(tokens.get(tokenId));
        let contentSrc = thumbnailSrc.get(tokenId);
        let txid = addAccessRecord(msg.caller, #retriveThumbnailSrc, ?token.index, #user(token.owner), #user(viewer), Time.now()); 
        return #Ok(#ContentSrc(contentSrc));
    };

    // Full photo retrival - requires authentication
    public shared(msg) func retrivePhotoSrc(tokenId: Nat, viewer: Principal) : async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        // Caller cannot be anonymous
        if(_isAnonymous(msg.caller) == true) {
            return #Err(#Unauthorized);
        };
        // Viewer cannot be anonymous
        if(_isAnonymous(viewer) == true) {
            return #Err(#Unauthorized);
        };

        let token = _unwrap(tokens.get(tokenId));
        let contentSrc = photoSrc.get(tokenId);
        let txid = addAccessRecord(msg.caller, #retrivePhotoSrc, ?token.index, #user(token.owner), #user(viewer), Time.now()); 
        return #Ok(#ContentSrc(contentSrc));
    };

    // Document retrival - restricted to owner/custodian
    public shared(msg) func retriveDocumentSrc(tokenId: Nat, viewer: Principal) : async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        // Only custodian and owner can access documents
        if(_isCustodian(msg.caller) == false and _isOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };
        // Viewer must have identity
        if(_isAnonymous(viewer) == true) {
            return #Err(#Unauthorized);
        };

        let token = _unwrap(tokens.get(tokenId));
        let contentSrc = documentSrc.get(tokenId);
        let txid = addAccessRecord(msg.caller, #retriveDocumentSrc, ?token.index, #user(token.owner), #user(viewer), Time.now()); 
        return #Ok(#ContentSrc(contentSrc));
    };

    // Retrieve decryption key - only for owner
    public shared(msg) func retriveDecryptionKey(tokenId: Nat) : async DecryptionKeyReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if(_isOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };

        let token = _unwrap(tokens.get(tokenId));
        let key = decryptionKeys.get(tokenId);
        let txid = addAccessRecord(msg.caller, #retriveDecryptionKey, ?token.index, #user(token.owner), #user(msg.caller), Time.now()); 
        return #Ok(key);
    };

    // Query functions
    public query func who_are_custodians() : async [Principal] {
        return TrieSet.toArray(custodians);
    };

    public query func historySize_access(): async Nat {
        return accessHistory.size();
    };

    public query func getAccessHistory(index: Nat): async TxRecord {
        return accessHistory[index];
    };

    public query func getLatestAccessHistory(): async TxRecord {
        return accessHistory[accessHistory.size()-1];
    };

    public query func getLatestContentSetupHistory(): async TxRecord {
        return contentSetupHistory[contentSetupHistory.size()-1];
    };

    public query func getLatestUpgradeHistory(): async TxRecord {
        return upgradeHistory[upgradeHistory.size()-1];
    };

    public query func getAccessHistorys(start: Nat, limit: Nat): async [TxRecord] {
        var res: [TxRecord] = [];
        var i = start;
        while (i < start + limit and i < accessHistory.size()) {
            res := Array_append(res, [accessHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getTokenThumbnailAccessAmount(tokenId: Nat): async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        var res: Nat = 0;        
        for (i in accessHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveThumbnailSrc) {
                    res += 1;
                };
            };
        };
        return #Ok(#AccessTimes(res));
    };

    public query func getTokenPhotoAccessAmount(tokenId: Nat): async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        var res: Nat = 0;        
        for (i in accessHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retrivePhotoSrc) {
                    res += 1;
                };
            };
        };
        return #Ok(#AccessTimes(res));
    };

    public query func getTokenDocumentAccessAmount(tokenId: Nat): async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        var res: Nat = 0;        
        for (i in accessHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveDocumentSrc) {
                    res += 1;
                };
            };
        };
        return #Ok(#AccessTimes(res));
    };

    public query func getTokenTotalAccessAmount(tokenId: Nat): async AccessReceipt {
        if(_exists(tokenId) == false) {
            return #Err(#TokenNotExist)
        };
        var res: Nat = 0;        
        for (i in accessHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveThumbnailSrc or i.op == #retrivePhotoSrc or i.op == #retriveDocumentSrc) {
                    res += 1;
                };
            };
        };
        return #Ok(#AccessTimes(res));
    };

    public query func getAllTokensTotalAccessAmount(): async AccessReceipt {
        var res: Nat = 0;        
        for (i in accessHistory.vals()) {
            if (i.op == #retriveThumbnailSrc or i.op == #retrivePhotoSrc or i.op == #retriveDocumentSrc) {
                res += 1;
            };
        };
        return #Ok(#AccessTimes(res));
    };

    // Check how many times all of a holder's historical place NFTs were accessed
    public query func getHolderAccessAmount(user: Principal): async Nat {
        var res: Nat = 0;
        for (i in accessHistory.vals()) {
            if (i.from == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    // Check how many times a user viewed historical place content
    public query func getUserViewingAmount(user: Principal): async Nat {
        var res: Nat = 0;
        for (i in accessHistory.vals()) {
            if (i.to == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    public query func getUserAccessHistorys(user: Principal, start: Nat, limit: Nat): async [TxRecord] {
        var res: [TxRecord] = [];
        var idx = 0;
        label l for (i in accessHistory.vals()) {
            if (i.from == #user(user)) {
                if(idx < start) {
                    idx += 1;
                    continue l;
                };
                if(idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };
    
    public query func getUserViewings(user: Principal, start: Nat, limit: Nat): async [TxRecord] {
        var res: [TxRecord] = [];
        var idx = 0;
        label l for (i in accessHistory.vals()) {
            if (i.to == #user(user)) {
                if(idx < start) {
                    idx += 1;
                    continue l;
                };
                if(idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };
    
    public query func getAllContentSetupHistory(): async [TxRecord] {
        var res: [TxRecord] = [];
        var i = 0;
        while (i < contentSetupHistory.size()) {
            res := Array_append(res, [contentSetupHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getAllUpgradeHistory(): async [TxRecord] {
        var res: [TxRecord] = [];
        var i = 0;
        while (i < upgradeHistory.size()) {
            res := Array_append(res, [upgradeHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getAllAccessHistory(): async [TxRecord] {
        var res: [TxRecord] = [];
        var start = 0;
        var limit = accessHistory.size();
        var i = start;
        while (i < start + limit and i < accessHistory.size()) {
            res := Array_append(res, [accessHistory[i]]);
            i += 1;
        };
        return res;    
    };

    public query func getTranscationFee(): async Nat {
        return transcationFee_;
    };

    // ********************END***********************
    // ******** Historical Places Protocol **********
    // **********************************************

    //Upgrade functions
    system func preupgrade() {
        usersEntries := Iter.toArray(users.entries());
        tokensEntries := Iter.toArray(tokens.entries());
        custodiansEntries := TrieSet.toArray(custodians);
        decryptionKeyEntries := Iter.toArray(decryptionKeys.entries());

        photoSrcEntires := Iter.toArray(photoSrc.entries());
        thumbnailSrcEntires := Iter.toArray(thumbnailSrc.entries());
        documentSrcEntires := Iter.toArray(documentSrc.entries());
    };

    system func postupgrade() {
        type TokenInfo = Types.TokenInfo;
        type UserInfo = Types.UserInfo;
        type DecryptionKey = Types.DecryptionKey;

        photoSrc := HashMap.fromIter<Nat, Text>(photoSrcEntires.vals(), 1, Nat.equal, Hash.hash);
        thumbnailSrc := HashMap.fromIter<Nat, Text>(thumbnailSrcEntires.vals(), 1, Nat.equal, Hash.hash);
        documentSrc := HashMap.fromIter<Nat, Text>(documentSrcEntires.vals(), 1, Nat.equal, Hash.hash);

        users := HashMap.fromIter<Principal, UserInfo>(usersEntries.vals(), 1, Principal.equal, Principal.hash);
        tokens := HashMap.fromIter<Nat, TokenInfo>(tokensEntries.vals(), 1, Nat.equal, Hash.hash);
        custodians := TrieSet.fromArray<Principal>(custodiansEntries, Principal.hash, Principal.equal);
        decryptionKeys := HashMap.fromIter<Nat, DecryptionKey>(decryptionKeyEntries.vals(), 1, Nat.equal, Hash.hash); 

        usersEntries := [];
        tokensEntries := [];
        custodiansEntries := [];
        decryptionKeyEntries := [];

        upgraded_at := Time.now();

        _commit("UPGRADE [AUTO RECORDING]")
    };

    public query func availableCycles() : async Nat {
        return Cycles.balance();
    };
}