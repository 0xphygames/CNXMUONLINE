
/* Move itens existentes entre o warehouse do jogo e o banco virtual do site.
   O item é preservado como o bloco binário original de 32 bytes. */
USE [MuOnlineS6];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.WebShopVirtualBankItem', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopVirtualBankItem
  (
    VirtualItemID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopVirtualBankItem PRIMARY KEY,
    AccountID VARCHAR(10) NOT NULL,
    SourceSlot TINYINT NOT NULL,
    ItemData VARBINARY(32) NOT NULL,
    Status VARCHAR(12) NOT NULL CONSTRAINT DF_WebShopVirtualBankItem_Status DEFAULT ('AVAILABLE'),
    DepositedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopVirtualBankItem_DepositedAt DEFAULT (SYSUTCDATETIME()),
    WithdrawnAt DATETIME2(0) NULL,
    CONSTRAINT CK_WebShopVirtualBankItem_Status CHECK (Status IN ('AVAILABLE','WITHDRAWN')),
    CONSTRAINT CK_WebShopVirtualBankItem_Data CHECK (DATALENGTH(ItemData) = 32)
  );
  CREATE INDEX IX_WebShopVirtualBankItem_AccountStatus
    ON dbo.WebShopVirtualBankItem(AccountID, Status, VirtualItemID);
END;
GO

IF OBJECT_ID(N'dbo.WebShopDepositWarehouseItem', N'P') IS NOT NULL DROP PROCEDURE dbo.WebShopDepositWarehouseItem;
GO
CREATE PROCEDURE dbo.WebShopDepositWarehouseItem
  @AccountID VARCHAR(10),
  @Slot INT,
  @VirtualItemID BIGINT OUTPUT
AS
BEGIN
  SET NOCOUNT ON; SET XACT_ABORT ON;
  IF @Slot < 0 OR @Slot >= 120 THROW 51100, 'Slot invalido.', 1;
  BEGIN TRANSACTION;
  DECLARE @Items VARBINARY(3840), @Item VARBINARY(32);
  SELECT @Items = Items FROM dbo.warehouse WITH (UPDLOCK, HOLDLOCK) WHERE AccountID=@AccountID;
  IF @Items IS NULL THROW 51101, 'Conta sem warehouse.', 1;
  SET @Item = SUBSTRING(@Items, (@Slot*32)+1, 32);
  IF @Item = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF
    THROW 51102, 'O slot esta vazio.', 1;
  IF EXISTS (SELECT 1 FROM dbo.WebShopVirtualBankItem WITH (UPDLOCK,HOLDLOCK) WHERE AccountID=@AccountID AND Status='AVAILABLE' AND SourceSlot=@Slot)
    THROW 51103, 'Este slot ja esta no banco virtual.', 1;
  INSERT dbo.WebShopVirtualBankItem(AccountID, SourceSlot, ItemData) VALUES(@AccountID,@Slot,@Item);
  SET @VirtualItemID = CONVERT(BIGINT,SCOPE_IDENTITY());
  UPDATE dbo.warehouse SET Items = STUFF(@Items, (@Slot*32)+1, 32,
    0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF)
    WHERE AccountID=@AccountID;
  COMMIT TRANSACTION;
END;
GO

IF OBJECT_ID(N'dbo.WebShopWithdrawWarehouseItem', N'P') IS NOT NULL DROP PROCEDURE dbo.WebShopWithdrawWarehouseItem;
GO
CREATE PROCEDURE dbo.WebShopWithdrawWarehouseItem
  @AccountID VARCHAR(10),
  @VirtualItemID BIGINT,
  @Slot INT = NULL OUTPUT
AS
BEGIN
  SET NOCOUNT ON; SET XACT_ABORT ON;
  BEGIN TRANSACTION;
  DECLARE @Items VARBINARY(3840), @Item VARBINARY(32);
  SELECT @Items=Items FROM dbo.warehouse WITH (UPDLOCK,HOLDLOCK) WHERE AccountID=@AccountID;
  SELECT @Item=ItemData FROM dbo.WebShopVirtualBankItem WITH (UPDLOCK,HOLDLOCK)
    WHERE VirtualItemID=@VirtualItemID AND AccountID=@AccountID AND Status='AVAILABLE';
  IF @Items IS NULL OR @Item IS NULL THROW 51110, 'Item virtual inexistente ou ja retirado.', 1;
  ;WITH Slots AS (SELECT TOP(120) ROW_NUMBER() OVER(ORDER BY (SELECT NULL))-1 AS N FROM sys.all_objects)
  SELECT TOP(1) @Slot=N FROM Slots WHERE SUBSTRING(@Items,(N*32)+1,32)=0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF ORDER BY N;
  IF @Slot IS NULL THROW 51111, 'Warehouse cheio.', 1;
  UPDATE dbo.warehouse SET Items=STUFF(@Items,(@Slot*32)+1,32,@Item) WHERE AccountID=@AccountID;
  UPDATE dbo.WebShopVirtualBankItem SET Status='WITHDRAWN', WithdrawnAt=SYSUTCDATETIME() WHERE VirtualItemID=@VirtualItemID;
  COMMIT TRANSACTION;
END;
GO

