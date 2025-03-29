/**
 * Module     : types.mo
 * Copyright  : 2024 Travel3 Team
 * License    : Apache 2.0
 */

import Time "mo:base/Time";
import TrieSet "mo:base/TrieSet";

module {
    public type Metadata = {
        logo : Text;
        name : Text;
        symbol : Text;
        desc : Text;
        totalSupply : Nat;
        owner : Principal;
        cycles : Nat;
        custodians : [Principal];
        created_at : Time.Time;
        upgraded_at : Time.Time;
        streamingRoyalty : Nat;
    };

    public type Errors = {
        #Unauthorized;
        #TokenNotExist;
        #InvalidOperator;
        #Other : Text;
    };

    public type ImageLocation = {
        icp : Text;
        ipfs : Text;
    };

    public type DocumentLocation = {
        icp : Text;
        ipfs : Text;
    };

    public type Attribute = {
        name : Text;
        location : Text;
        coordinates : Text;
        collection : Text;
        year : Text;
        category : Text;
        historicalPeriod : Text;
        culturalSignificance : Text;
        architecturalStyle : ?Text;
    };

    public type TokenMetadata = {
        tokenIdentifier : Text;

        mainImageType : Text;
        mainImageLocation : ImageLocation;

        additionalImagesType : Text;
        additionalImagesLocation : [ImageLocation];

        documentType : Text;
        documentLocation : DocumentLocation;

        thumbnailType : Text;
        thumbnailLocation : ImageLocation;

        attributes : Attribute;
    };

    public type DecryptionKey = {
        iv : Text;
        privateKey : Text;
    };

    public type DecryptionKeyReceipt = {
        #Ok : ?DecryptionKey;
        #Err : Errors;
    };

    public type CustodianSetupReceipt = {
        #Ok : Text;
        #Err : Text;
    };

    public type ViewingResult = {
        #ImageLocation : ?ImageLocation;
        #DocumentLocation : ?DocumentLocation;
        #ViewingTimes : Nat;
    };

    public type TokenInfo = {
        index : Nat;
        var owner : Principal;
        var metadata : ?TokenMetadata;
        var operator : ?Principal;
        timestamp : Time.Time;
    };

    public type TokenInfoExt = {
        index : Nat;
        owner : Principal;
        metadata : ?TokenMetadata;
        operator : ?Principal;
        timestamp : Time.Time;
    };
    public type UserInfo = {
        var operators : TrieSet.Set<Principal>; // principals allowed to operate on the user's behalf
        var allowedBy : TrieSet.Set<Principal>; // principals approved user to operate their's tokens
        var allowedTokens : TrieSet.Set<Nat>; // tokens the user can operate
        var tokens : TrieSet.Set<Nat>; // user's tokens
    };

    public type UserInfoExt = {
        operators : [Principal];
        allowedBy : [Principal];
        allowedTokens : [Nat];
        tokens : [Nat];
    };
    /// Update call operations
    public type Operation = {
        #mint : ?TokenMetadata;
        #burn;
        #transfer;
        #transferFrom;
        #approve;
        #approveAll;
        #revokeAll; // revoke approvals
        #setMetadata;
        #setTranscationFee;
        #setStreamingRoyalty;

        #setImageLocation;
        #retriveImageLocation;

        #setDocumentLocation;
        #retriveDocumentLocation;

        #setDecryptionKey;
        #retriveDecryptionKey;

        #upgrade;
    };
    /// Update call operation record fields
    public type Record = {
        #user : Principal;
        #metadata : ?TokenMetadata; // op == #setMetadata
        #transcationFee : Nat;
        #secret : Text;
        #commit : UpgradeHistory;
    };

    public type UpgradeHistory = {
        message : Text;
        upgrade_time : Time.Time;
    };

    public type TxRecord = {
        caller : Principal;
        op : Operation;
        index : Nat;
        tokenIndex : ?Nat;
        from : Record;
        to : Record;
        timestamp : Time.Time;
    };
};
