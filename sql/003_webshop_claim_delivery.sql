USE [MuOnlineS6];
GO
IF COL_LENGTH('dbo.WebShopDelivery', 'ClaimedAt') IS NULL
  ALTER TABLE dbo.WebShopDelivery ADD ClaimedAt DATETIME2(0) NULL;
GO
IF OBJECT_ID(N'dbo.WebShopClaimDelivery', N'P') IS NOT NULL DROP PROCEDURE dbo.WebShopClaimDelivery;
GO
CREATE PROCEDURE dbo.WebShopClaimDelivery
  @AccountID VARCHAR(10),
  @DeliveryID BIGINT
AS
BEGIN
  SET NOCOUNT ON;
  UPDATE dbo.WebShopDelivery
    SET ClaimedAt = SYSUTCDATETIME()
  WHERE DeliveryID = @DeliveryID AND AccountID = @AccountID
    AND DeliveryStatus = 'DELIVERED' AND ClaimedAt IS NULL;
  IF @@ROWCOUNT = 0 THROW 51010, 'Entrega inexistente, já transferida ou não pertence à conta.', 1;
END;
GO

