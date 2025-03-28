import Time "mo:base/Time";

module {
  public type ErrorCode = {
    #InvalidInput;
    #Unauthorized;
    #NotFound;
    #AlreadyExists;
    #ValidationError;
  };

  public type Result<T> = {
    #ok : T;
    #err : ErrorCode;
  };

  public type DateRange = {
    startDate: Time.Time;
    endDate: Time.Time;
  };

  public func isValidDateRange(range: DateRange): Bool {
    return range.startDate < range.endDate and range.startDate >= Time.now();
  };

  public func validateText(text: Text, fieldName: Text): Result<Text> {
    if (text.size() == 0) {
      return #err(#ValidationError);
    };
    #ok(text)
  };

  public func validateNat(n: Nat, fieldName: Text, minValue: Nat): Result<Nat> {
    if (n < minValue) {
      return #err(#ValidationError);
    };
    #ok(n)
  };
}
