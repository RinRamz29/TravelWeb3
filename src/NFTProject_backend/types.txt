/**
 * Module     : main.mo
 * Copyright  : 2025 ReSky
 * License    : Apache 2.0 with LLVM Exception
 * Maintainer : ReSky
 * Stability  : Experimental
 */



import Time "mo:base/Time";
import TrieSet "mo:base/TrieSet";

module {
    public type Metadata = {
        logo: Text;
        name: Text;
        symbol: Text;
        desc: Text;
        totalSupply: Nat;
        owner: Principal;
        cycles: Nat;
        custodians: [Principal];
        created_at : Time.Time;
        upgraded_at : Time.Time;
    };

    public type PhotoLocation = {
        icp: Text;
        ipfs: Text; 
    };

    public type DocumentLocation = {
        icp: Text; 
        ipfs: Text; 
    };

    public type Attribute = {
        name: Text;
        year: Nat;  // Year of historical significance
        location: Text; // Geographic location
        coordinates: ?Text; // Optional coordinates
        category: [Text]; // Categories like "Monument", "Battlefield", "Ancient Site" etc.
        significance: Text; // Historical significance
    };
       
    public type TokenMetadata = {
        tokenIdentifier: Text; // Place identifier

        photoType: Text; // .jpg, .png etc.
        photoLocation: PhotoLocation;
        
        thumbnailType: Text; // Smaller version for previews
        thumbnailLocation: PhotoLocation;
        
        documentType: Text; // .pdf, .txt etc.
        documentLocation: DocumentLocation;
        
        attributes: Attribute;
    };

    public type DecryptionKey = {
        iv: Text;
        privateKey: Text;
    };

    public type TokenInfo = {
        index: Nat;
        var owner: Principal;
        var metadata: ?TokenMetadata;
        var operator: ?Principal;
        timestamp: Time.Time;
    };

    public type TokenInfoExt = {
        index: Nat;
        owner: Principal;
        metadata: ?TokenMetadata;
        operator: ?Principal;
        timestamp: Time.Time;
    };
    
    public type UserInfo = {
        var operators: TrieSet.Set<Principal>;     // principals allowed to operate on the user's behalf
        var allowedBy: TrieSet.Set<Principal>;     // principals approved user to operate their's tokens
        var allowedTokens: TrieSet.Set<Nat>;       // tokens the user can operate
        var tokens: TrieSet.Set<Nat>;              // user's tokens
    };

    public type UserInfoExt = {
        operators: [Principal];
        allowedBy: [Principal];
        allowedTokens: [Nat];
        tokens: [Nat];
    };
    
    /// Update call operations
    public type Operation = {
        #mint: ?TokenMetadata;  
        #burn;
        #transfer;
        #transferFrom;
        #approve;
        #approveAll;
        #revokeAll; // revoke approvals
        #setMetadata;
        #setTranscationFee;
        
        #setPhotoSrc;
        #retrivePhotoSrc;
        
        #setThumbnailSrc;
        #retriveThumbnailSrc;
        
        #setDocumentSrc;
        #retriveDocumentSrc;
        
        #setDecryptionKey;
        #retriveDecryptionKey;
        
        #upgrade;
    };
    
    /// Update call operation record fields
    public type Record = {
        #user: Principal;
        #metadata: ?TokenMetadata; // op == #setMetadata
        #transcationFee: Nat;
        #secret: Text;
        #commit: UpgradeHistory;
    };
    
    public type UpgradeHistory = {
        message: Text;
        upgrade_time: Time.Time;
    };

    public type TxRecord = {
        caller: Principal;
        op: Operation;
        index: Nat;
        tokenIndex: ?Nat;
        from: Record;
        to: Record;
        timestamp: Time.Time;
    };
};