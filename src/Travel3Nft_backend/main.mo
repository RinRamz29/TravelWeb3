/**
 * Module     : main.mo
 * Copyright  : 2024 Travel3 Team
 * License    : Apache 2.0 with LLVM Exception
 * Maintainer : Travel3 Team <octai@octaimusic.com>
 * Stability  : Experimental
 */

import Result "mo:base/Result";
import Buffer "mo:base/Buffer";

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
import Prelude "mo:base/Prelude";
import Debug "mo:base/Debug";
import Types "./types";

shared (msg) actor class NFToken(
    _logo : Text,
    _name : Text,
    _symbol : Text,
    _desc : Text,
    _owner : Principal,
    _transcationFee : ?Nat,
) = this {

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

    public type TxReceipt = {
        #Ok : Nat;
        #Err : Errors;
    };

    public type MintResult = {
        #Ok : (Nat, Nat);
        #Err : Errors;
    };

    private stable var logo_ : Text = _logo;
    private stable var name_ : Text = _name;
    private stable var symbol_ : Text = _symbol;
    private stable var desc_ : Text = _desc;
    private stable var owner_ : Principal = _owner;
    private stable var streamingRoyalty_ : Nat = 0;
    private stable var created_at : Time.Time = Time.now();
    private stable var viewingFee_ : Nat = 0;
    private stable var upgraded_at : Time.Time = Time.now();

    //@Travel3: Add custodian
    private stable var custodiansEntries : [Principal] = [];
    private var custodians = TrieSet.fromArray<Principal>(
        [owner_],
        Principal.hash,
        Principal.equal,
    );
    private stable var totalSupply_ : Nat = 0;
    private stable var blackhole : Principal = Principal.fromText("aaaaa-aa");
    private stable var tokensEntries : [(Nat, TokenInfo)] = [];
    private stable var usersEntries : [(Principal, UserInfo)] = [];
    private stable var txs : [TxRecord] = [];

    private var tokens = HashMap.HashMap<Nat, TokenInfo>(32, Nat.equal, Hash.hash);
    private var users = HashMap.HashMap<Principal, UserInfo>(32, Principal.equal, Principal.hash);
    private stable var txIndex : Nat = 0;

    private var imageLocations = HashMap.HashMap<Nat, ImageLocation>(32, Nat.equal, Hash.hash);
    private var documentLocations = HashMap.HashMap<Nat, DocumentLocation>(32, Nat.equal, Hash.hash);

    private func Array_append<T>(xs : [T], ys : [T]) : [T] {
        let zs : Buffer.Buffer<T> = Buffer.Buffer(xs.size() +ys.size());
        for (x in xs.vals()) {
            zs.add(x);
        };
        for (y in ys.vals()) {
            zs.add(y);
        };
        return zs.toArray();
    };

    private func addTxRecord(
        caller : Principal,
        op : Operation,
        tokenIndex : ?Nat,
        from : Record,
        to : Record,
        timestamp : Time.Time,
    ) : Nat {
        let record : TxRecord = {
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

    private func _unwrap<T>(x : ?T) : T = switch x {
        case null { Prelude.unreachable() };
        case (?x_) { x_ };
    };

    private func _exists(tokenId : Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return true };
            case _ { return false };
        };
    };

    private func _ownerOf(tokenId : Nat) : ?Principal {
        switch (tokens.get(tokenId)) {
            case (?info) { return ?info.owner };
            case (_) { return null };
        };
    };

    private func _isOwner(who : Principal, tokenId : Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return info.owner == who };
            case _ { return false };
        };
    };

    private func _isApproved(who : Principal, tokenId : Nat) : Bool {
        switch (tokens.get(tokenId)) {
            case (?info) { return info.operator == ?who };
            case _ { return false };
        };
    };

    private func _balanceOf(who : Principal) : Nat {
        switch (users.get(who)) {
            case (?user) { return TrieSet.size(user.tokens) };
            case (_) { return 0 };
        };
    };

    private func _newUser() : UserInfo {
        {
            var operators = TrieSet.empty<Principal>();
            var allowedBy = TrieSet.empty<Principal>();
            var allowedTokens = TrieSet.empty<Nat>();
            var tokens = TrieSet.empty<Nat>();
        };
    };

    private func _tokenInfotoExt(info : TokenInfo) : TokenInfoExt {
        return {
            index = info.index;
            owner = info.owner;
            metadata = info.metadata;
            timestamp = info.timestamp;
            operator = info.operator;
        };
    };

    private func _userInfotoExt(info : UserInfo) : UserInfoExt {
        return {
            operators = TrieSet.toArray(info.operators);
            allowedBy = TrieSet.toArray(info.allowedBy);
            allowedTokens = TrieSet.toArray(info.allowedTokens);
            tokens = TrieSet.toArray(info.tokens);
        };
    };

    private func _isApprovedOrOwner(spender : Principal, tokenId : Nat) : Bool {
        switch (_ownerOf(tokenId)) {
            case (?owner) {
                return spender == owner or _isApproved(spender, tokenId) or _isApprovedForAll(owner, spender);
            };
            case _ {
                return false;
            };
        };
    };

    private func _getApproved(tokenId : Nat) : ?Principal {
        switch (tokens.get(tokenId)) {
            case (?info) {
                return info.operator;
            };
            case (_) {
                return null;
            };
        };
    };

    private func _isApprovedForAll(owner : Principal, operator : Principal) : Bool {
        switch (users.get(owner)) {
            case (?user) {
                return TrieSet.mem(user.operators, operator, Principal.hash(operator), Principal.equal);
            };
            case _ { return false };
        };
    };

    private func _addTokenTo(to : Principal, tokenId : Nat) {
        switch (users.get(to)) {
            case (?user) {
                user.tokens := TrieSet.put(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(to, user);
            };
            case _ {
                let user = _newUser();
                user.tokens := TrieSet.put(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(to, user);
            };
        };
    };

    private func _removeTokenFrom(owner : Principal, tokenId : Nat) {
        assert (_exists(tokenId) and _isOwner(owner, tokenId));
        switch (users.get(owner)) {
            case (?user) {
                user.tokens := TrieSet.delete(user.tokens, tokenId, Hash.hash(tokenId), Nat.equal);
                users.put(owner, user);
            };
            case _ {
                assert (false);
            };
        };
    };

    private func _clearApproval(owner : Principal, tokenId : Nat) {
        assert (_exists(tokenId) and _isOwner(owner, tokenId));
        switch (tokens.get(tokenId)) {
            case (?info) {
                if (info.operator != null) {
                    let op = _unwrap(info.operator);
                    let opInfo = _unwrap(users.get(op));
                    opInfo.allowedTokens := TrieSet.delete(opInfo.allowedTokens, tokenId, Hash.hash(tokenId), Nat.equal);
                    users.put(op, opInfo);
                    info.operator := null;
                    tokens.put(tokenId, info);
                };
            };
            case _ {
                assert (false);
            };
        };
    };

    private func _transfer(to : Principal, tokenId : Nat) {
        assert (_exists(tokenId));

        if (to == blackhole) {
            Debug.trap("Cannot transfer to blackhole address");
        };

        switch (tokens.get(tokenId)) {
            case (?info) {
                _removeTokenFrom(info.owner, tokenId);
                _addTokenTo(to, tokenId);
                info.owner := to;
                tokens.put(tokenId, info);
            };
            case (_) {
                assert (false);
            };
        };
    };

    private func _burn(owner : Principal, tokenId : Nat) {
        _clearApproval(owner, tokenId);
        _transfer(blackhole, tokenId);
    };

    //@Travel3: add custodian can mint and adjust token metadata
    public shared (msg) func mint(to : Principal, metadata : ?TokenMetadata) : async MintResult {
        if (not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };

        let token : TokenInfo = {
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

    public shared (msg) func burn(tokenId : Nat) : async TxReceipt {
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if (_isOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };
        _burn(msg.caller, tokenId);
        let txid = addTxRecord(msg.caller, #burn, ?tokenId, #user(msg.caller), #user(blackhole), Time.now());
        return #Ok(txid);
    };

    //@Travel3: add custodian can adjust token metadata
    public shared (msg) func setTokenMetadata(tokenId : Nat, new_metadata : TokenMetadata) : async TxReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        let token = _unwrap(tokens.get(tokenId));
        let old_metadate = token.metadata;
        token.metadata := ?new_metadata;
        tokens.put(tokenId, token);
        let txid = addTxRecord(msg.caller, #setMetadata, ?token.index, #metadata(old_metadate), #metadata(?new_metadata), Time.now());
        return #Ok(txid);
    };

    public shared (msg) func approve(tokenId : Nat, operator : Principal) : async TxReceipt {
        var owner : Principal = switch (_ownerOf(tokenId)) {
            case (?own) {
                own;
            };
            case (_) {
                return #Err(#TokenNotExist);
            };
        };

        if (Principal.equal(msg.caller, owner) == false) if (_isApprovedForAll(owner, msg.caller) == false) return #Err(#Unauthorized);

        if (owner == operator) {
            return #Err(#InvalidOperator);
        };

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

    public shared (msg) func setApprovalForAll(operator : Principal, value : Bool) : async TxReceipt {
        if (msg.caller == operator) {
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
                case _ {};
            };
            switch (users.get(operator)) {
                case (?user) {
                    user.allowedBy := TrieSet.delete(user.allowedBy, msg.caller, Principal.hash(msg.caller), Principal.equal);
                    users.put(operator, user);
                };
                case _ {};
            };
            txid := addTxRecord(msg.caller, #revokeAll, null, #user(msg.caller), #user(operator), Time.now());
        };
        return #Ok(txid);
    };

    public shared (msg) func transfer(to : Principal, tokenId : Nat) : async TxReceipt {
        var owner : Principal = switch (_ownerOf(tokenId)) {
            case (?own) {
                own;
            };
            case (_) {
                return #Err(#TokenNotExist);
            };
        };

        if (owner != msg.caller) {
            return #Err(#Unauthorized);
        };

        _clearApproval(msg.caller, tokenId);
        _transfer(to, tokenId);
        let txid = addTxRecord(msg.caller, #transfer, ?tokenId, #user(msg.caller), #user(to), Time.now());
        return #Ok(txid);
    };

    public shared (msg) func transferFrom(from : Principal, to : Principal, tokenId : Nat) : async TxReceipt {
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if (_isApprovedOrOwner(msg.caller, tokenId) == false) {
            return #Err(#Unauthorized);
        };
        _clearApproval(from, tokenId);
        _transfer(to, tokenId);
        let txid = addTxRecord(msg.caller, #transferFrom, ?tokenId, #user(from), #user(to), Time.now());
        return #Ok(txid);
    };

    public query func logo() : async Text {
        return logo_;
    };

    public query func name() : async Text {
        return name_;
    };

    public query func symbol() : async Text {
        return symbol_;
    };

    public query func desc() : async Text {
        return desc_;
    };

    public query func balanceOf(who : Principal) : async Nat {
        return _balanceOf(who);
    };

    public query func totalSupply() : async Nat {
        return totalSupply_;
    };

    public query func getMetadata() : async Metadata {
        {
            logo = logo_;
            name = name_;
            symbol = symbol_;
            desc = desc_;
            totalSupply = totalSupply_;
            owner = owner_;
            cycles = Cycles.balance(); //@Travel3
            custodians = TrieSet.toArray(custodians); //@Travel3
            created_at = created_at; //@Travel3
            upgraded_at = upgraded_at; //@Travel3
            streamingRoyalty = streamingRoyalty_; //@Travel3
        };
    };

    public query func isApprovedForAll(owner : Principal, operator : Principal) : async Bool {
        return _isApprovedForAll(owner, operator);
    };

    public query func getOperator(tokenId : Nat) : async Principal {
        switch (_exists(tokenId)) {
            case true {
                switch (_getApproved(tokenId)) {
                    case (?who) {
                        return who;
                    };
                    case (_) {
                        return Principal.fromText("aaaaa-aa");
                    };
                };
            };
            case (_) {
                throw Error.reject("token not exist");
            };
        };
    };

    public query func getUserInfo(who : Principal) : async UserInfoExt {
        switch (users.get(who)) {
            case (?user) {
                return _userInfotoExt(user);
            };
            case _ {
                throw Error.reject("unauthorized");
            };
        };
    };

    public query func getUserTokens(owner : Principal) : async [TokenInfoExt] {
        let tokenIds = switch (users.get(owner)) {
            case (?user) {
                TrieSet.toArray(user.tokens);
            };
            case _ { [] };
        };
        var ret : [TokenInfoExt] = [];
        for (id in Iter.fromArray(tokenIds)) {
            ret := Array_append(ret, [_tokenInfotoExt(_unwrap(tokens.get(id)))]);
        };
        return ret;
    };

    public query func ownerOf(tokenId : Nat) : async Principal {
        switch (_ownerOf(tokenId)) {
            case (?owner) {
                return owner;
            };
            case _ {
                throw Error.reject("token not exist");
            };
        };
    };

    public query func getTokenInfo(tokenId : Nat) : async TokenInfoExt {
        switch (tokens.get(tokenId)) {
            case (?tokeninfo) {
                return _tokenInfotoExt(tokeninfo);
            };
            case (_) {
                throw Error.reject("token not exist");
            };
        };
    };

    public query func getAllTokens() : async [TokenInfoExt] {
        Iter.toArray(Iter.map(tokens.entries(), func(i : (Nat, TokenInfo)) : TokenInfoExt { _tokenInfotoExt(i.1) }));
    };

    //@Travel3
    public query func getAllHolders() : async [Principal] {
        let temp : [Principal] = Iter.toArray(Iter.map(tokens.entries(), func(i : (Nat, TokenInfo)) : Principal { _tokenInfotoExt(i.1).owner }));
        return TrieSet.toArray(TrieSet.fromArray(temp, Principal.hash, Principal.equal));
    };

    public query func historySize() : async Nat {
        return txs.size();
    };

    public query func getTransaction(index : Nat) : async TxRecord {
        return txs[index];
    };

    public query func getTransactions(start : Nat, limit : Nat) : async [TxRecord] {
        var res : [TxRecord] = [];
        var i = start;
        while (i < start + limit and i < txs.size()) {
            res := Array_append(res, [txs[i]]);
            i += 1;
        };
        return res;
    };

    public query func getUserTransactionAmount(user : Principal) : async Nat {
        var res : Nat = 0;
        for (i in txs.vals()) {
            if (i.caller == user or i.from == #user(user) or i.to == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    public query func getUserTransactions(user : Principal, start : Nat, limit : Nat) : async [TxRecord] {
        var res : [TxRecord] = [];
        var idx = 0;
        label l for (i in txs.vals()) {
            if (i.caller == user or i.from == #user(user) or i.to == #user(user)) {
                if (idx < start) {
                    idx += 1;
                    continue l;
                };
                if (idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };

    type ImageLocation = Types.ImageLocation;
    type DocumentLocation = Types.DocumentLocation;
    type DecryptionKey = Types.DecryptionKey;

    private stable var viewingHistory : [TxRecord] = [];
    private stable var placeSetupHistory : [TxRecord] = [];
    private stable var upgradeHistory : [TxRecord] = [];

    private stable var viewingIndex : Nat = 0;
    private stable var placeSetupIndex : Nat = 0;
    private stable var upgradeIndex : Nat = 0;

    private stable var decryptionKeyEntries : [(Nat, DecryptionKey)] = [];
    private stable var imageLocationEntires : [(Nat, ImageLocation)] = [];
    private stable var documentLocationEntires : [(Nat, DocumentLocation)] = [];

    private var decryptionKeys = HashMap.HashMap<Nat, DecryptionKey>(32, Nat.equal, Hash.hash);

    private stable var transcationFee_ : Nat = 0;
    switch _transcationFee {
        case null { transcationFee_ := 0 };
        case (?_transcationFee) { transcationFee_ := _transcationFee };
    };

    public type PlaceSetupReceipt = {
        #Ok : (Nat, Text);
        #Err : Errors;
    };

    public type ViewingReceipt = {
        #Ok : ViewingResult;
        #Err : Errors;
    };

    public type ViewingResult = {
        #ImageLocation : ?ImageLocation;
        #DocumentLocation : ?DocumentLocation;
        #ViewingTimes : Nat;
    };

    private func _isAnonymous(caller : Principal) : Bool {
        Principal.equal(caller, Principal.fromText("2vxsx-fae"));
    };

    private func _isCustodian(principal : Principal) : Bool {
        return TrieSet.mem(custodians, principal, Principal.hash(principal), Principal.equal);
    };

    private func _commit(_message : Text, caller : Principal) {
        let upgradeHistory : Types.UpgradeHistory = {
            message = _message;
            upgrade_time = upgraded_at;
        };

        let txid = addUpgradeRecord(caller, #upgrade, null, #user(caller), #commit(upgradeHistory), upgraded_at);
    };

    private func addViewingRecord(
        caller : Principal,
        op : Operation,
        tokenIndex : ?Nat,
        from : Record,
        to : Record,
        timestamp : Time.Time,
    ) : Nat {
        let record : TxRecord = {
            caller = caller;
            op = op;
            index = viewingIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        viewingHistory := Array_append(viewingHistory, [record]);
        viewingIndex += 1;
        return viewingIndex - 1;
    };

    private func addPlaceSetupRecord(
        caller : Principal,
        op : Operation,
        tokenIndex : ?Nat,
        from : Record,
        to : Record,
        timestamp : Time.Time,
    ) : Nat {
        let record : TxRecord = {
            caller = caller;
            op = op;
            index = placeSetupIndex;
            tokenIndex = tokenIndex;
            from = from;
            to = to;
            timestamp = timestamp;
        };
        placeSetupHistory := Array_append(placeSetupHistory, [record]);
        placeSetupIndex += 1;
        return placeSetupIndex - 1;
    };

    private func addUpgradeRecord(
        caller : Principal,
        op : Operation,
        tokenIndex : ?Nat,
        from : Record,
        to : Record,
        timestamp : Time.Time,
    ) : Nat {
        let record : TxRecord = {
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

    public shared (msg) func commit(_message : Text) : async PlaceSetupReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        upgraded_at := Time.now();
        _commit(_message, msg.caller);
        return #Ok((0, _message));
    };

    public shared (msg) func addCustodian(new_custodian : Principal) : async Types.CustodianSetupReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err("Unauthorized");
        } else if (_isCustodian(new_custodian)) {
            return #Err("The object has already existed");
        } else {
            custodians := TrieSet.put(custodians, new_custodian, Principal.hash(new_custodian), Principal.equal);
            return #Ok(Principal.toText(new_custodian));
        };
    };

    public shared (msg) func removeCustodian(removed_custodian : Principal) : async Types.CustodianSetupReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err("Unauthorized");
        } else if (not _isCustodian(removed_custodian)) {
            return #Err("The object does not exist");
        } else {
            custodians := TrieSet.delete(custodians, removed_custodian, Principal.hash(removed_custodian), Principal.equal);
            return #Ok(Principal.toText(removed_custodian));
        };
    };

    public shared (msg) func setStreamingRoyalty(_streamingRoyalty : Nat) : async TxReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        let old_streamingRoyalty = streamingRoyalty_;
        streamingRoyalty_ := _streamingRoyalty;
        let txid = addTxRecord(msg.caller, #setStreamingRoyalty, null, #transcationFee(old_streamingRoyalty), #transcationFee(streamingRoyalty_), Time.now());
        return #Ok(txid);
    };

    public shared (msg) func setViewingFee(_viewingFee : Nat) : async TxReceipt {
        if (not _isCustodian(msg.caller)) {
            return #Err(#Unauthorized);
        };
        let old_viewingFee = viewingFee_;
        viewingFee_ := _viewingFee;
        return #Ok(0);
    };

    public query func who_are_custodians() : async [Principal] {
        return TrieSet.toArray(custodians);
    };

    public query func historySize_viewing() : async Nat {
        return viewingHistory.size();
    };

    public query func getViewingHistory(index : Nat) : async TxRecord {
        return viewingHistory[index];
    };

    public query func getLatestViewingHistory() : async TxRecord {
        return viewingHistory[viewingHistory.size() -1];
    };

    public query func getLatestPlaceSetupHistory() : async TxRecord {
        return placeSetupHistory[placeSetupHistory.size() -1];
    };

    public query func getLatestUpgradeHistory() : async TxRecord {
        return upgradeHistory[upgradeHistory.size() -1];
    };

    public query func getViewingHistorys(start : Nat, limit : Nat) : async [TxRecord] {
        var res : [TxRecord] = [];
        var i = start;
        while (i < start + limit and i < viewingHistory.size()) {
            res := Array_append(res, [viewingHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getTokenImageViewingAmount(tokenId : Nat) : async ViewingReceipt {
        if (_isAnonymous(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if (not _isApprovedOrOwner(msg.caller, tokenId)) {
            return #Err(#Unauthorized);
        };
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveImageLocation) {
                    res += 1;
                };
            };
        };
        return #Ok(#ViewingTimes(res));
    };

    public query func getTokenDocumentViewingAmount(tokenId : Nat) : async ViewingReceipt {
        if (_isAnonymous(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if (not _isApprovedOrOwner(msg.caller, tokenId)) {
            return #Err(#Unauthorized);
        };
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveDocumentLocation) {
                    res += 1;
                };
            };
        };
        return #Ok(#ViewingTimes(res));
    };

    public query func getTokenTotalViewingAmount(tokenId : Nat) : async ViewingReceipt {
        if (_isAnonymous(msg.caller)) {
            return #Err(#Unauthorized);
        };
        if (_exists(tokenId) == false) {
            return #Err(#TokenNotExist);
        };
        if (not _isApprovedOrOwner(msg.caller, tokenId)) {
            return #Err(#Unauthorized);
        };
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (_unwrap(i.tokenIndex) == tokenId) {
                if (i.op == #retriveImageLocation or i.op == #retriveDocumentLocation) {
                    res += 1;
                };
            };
        };
        return #Ok(#ViewingTimes(res));
    };

    public query func getAllTokenTotalViewingAmount() : async ViewingReceipt {
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (i.op == #retriveImageLocation or i.op == #retriveDocumentLocation) {
                res += 1;
            };
        };
        return #Ok(#ViewingTimes(res));
    };

    public query func getHolderViewingAmount(user : Principal) : async Nat {
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (i.from == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    public query func getUserViewingAmount(user : Principal) : async Nat {
        var res : Nat = 0;
        for (i in viewingHistory.vals()) {
            if (i.to == #user(user)) {
                res += 1;
            };
        };
        return res;
    };

    public query func getUserViewingHistorys(user : Principal, start : Nat, limit : Nat) : async [TxRecord] {
        var res : [TxRecord] = [];
        var idx = 0;
        label l for (i in viewingHistory.vals()) {
            if (i.from == #user(user)) {
                if (idx < start) {
                    idx += 1;
                    continue l;
                };
                if (idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };

    public query func getUserViewings(user : Principal, start : Nat, limit : Nat) : async [TxRecord] {
        var res : [TxRecord] = [];
        var idx = 0;
        label l for (i in viewingHistory.vals()) {
            if (i.to == #user(user)) {
                if (idx < start) {
                    idx += 1;
                    continue l;
                };
                if (idx >= start + limit) {
                    break l;
                };
                res := Array_append<TxRecord>(res, [i]);
                idx += 1;
            };
        };
        return res;
    };

    public query func getAllPlaceSetupHistory() : async [TxRecord] {
        var res : [TxRecord] = [];
        var i = 0;
        while (i < placeSetupHistory.size()) {
            res := Array_append(res, [placeSetupHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getAllUpgradeHistory() : async [TxRecord] {
        var res : [TxRecord] = [];
        var i = 0;
        while (i < upgradeHistory.size()) {
            res := Array_append(res, [upgradeHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getAllViewingHistory() : async [TxRecord] {
        var res : [TxRecord] = [];
        var start = 0;
        var limit = viewingHistory.size();
        var i = start;
        while (i < start + limit and i < viewingHistory.size()) {
            res := Array_append(res, [viewingHistory[i]]);
            i += 1;
        };
        return res;
    };

    public query func getTranscationFee() : async Nat {
        return transcationFee_;
    };

    system func preupgrade() {
        usersEntries := Iter.toArray(users.entries());
        tokensEntries := Iter.toArray(tokens.entries());
        custodiansEntries := TrieSet.toArray(custodians);
        decryptionKeyEntries := Iter.toArray(decryptionKeys.entries());

        imageLocationEntires := Iter.toArray(imageLocations.entries());
        documentLocationEntires := Iter.toArray(documentLocations.entries());

        streamingRoyalty_ := streamingRoyalty_;
        viewingFee_ := viewingFee_;
    };

    system func postupgrade() {
        imageLocations := HashMap.fromIter<Nat, ImageLocation>(imageLocationEntires.vals(), 32, Nat.equal, Hash.hash);
        documentLocations := HashMap.fromIter<Nat, DocumentLocation>(documentLocationEntires.vals(), 32, Nat.equal, Hash.hash);

        users := HashMap.fromIter<Principal, UserInfo>(usersEntries.vals(), 32, Principal.equal, Principal.hash);
        tokens := HashMap.fromIter<Nat, TokenInfo>(tokensEntries.vals(), 32, Nat.equal, Hash.hash);
        custodians := TrieSet.fromArray<Principal>(custodiansEntries, Principal.hash, Principal.equal);
        decryptionKeys := HashMap.fromIter<Nat, DecryptionKey>(decryptionKeyEntries.vals(), 32, Nat.equal, Hash.hash);

        usersEntries := [];
        tokensEntries := [];
        custodiansEntries := [];
        decryptionKeyEntries := [];

        upgraded_at := Time.now();

        _commit("UPGRADE [AUTO RECORDING]", owner_)

    };

    public query func availableCycles() : async Nat {
        return Cycles.balance();
    };

};
