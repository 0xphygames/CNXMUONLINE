/*
  WebShop integrado ao CashShop do MuOnlineS6.
  Execute no banco MuOnlineS6.

  Importante:
  - O script não apaga nem altera dados existentes.
  - Produtos começam inativos e sem código de entrega.
  - Preencha os índices reais do CashShopProduct.txt antes de ativar.
  - Itens são entregues em dbo.CashShopInventory, que funciona como baú
    virtual da conta e é lido pelo CashShop do jogo.
*/
USE [MuOnlineS6];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.WebShopCategory', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopCategory
  (
    CategoryID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopCategory PRIMARY KEY,
    Slug VARCHAR(40) NOT NULL CONSTRAINT UQ_WebShopCategory_Slug UNIQUE,
    Name VARCHAR(80) NOT NULL,
    SortOrder INT NOT NULL CONSTRAINT DF_WebShopCategory_SortOrder DEFAULT (0),
    IsActive BIT NOT NULL CONSTRAINT DF_WebShopCategory_IsActive DEFAULT (1),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopCategory_CreatedAt DEFAULT (SYSUTCDATETIME())
  );
END;
GO

IF OBJECT_ID(N'dbo.WebShopProduct', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopProduct
  (
    ProductID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopProduct PRIMARY KEY,
    CategoryID INT NOT NULL,
    Slug VARCHAR(80) NOT NULL CONSTRAINT UQ_WebShopProduct_Slug UNIQUE,
    Name VARCHAR(120) NOT NULL,
    Description VARCHAR(500) NULL,
    ImagePath VARCHAR(255) NULL,
    Currency CHAR(1) NOT NULL CONSTRAINT CK_WebShopProduct_Currency CHECK (Currency IN ('C','P','G')),
    Price INT NOT NULL CONSTRAINT CK_WebShopProduct_Price CHECK (Price > 0),
    Quantity INT NOT NULL CONSTRAINT DF_WebShopProduct_Quantity DEFAULT (1),
    /* Índices do produto no CashShop do servidor. */
    InventoryType INT NULL,
    PackageMainIndex INT NULL,
    ProductBaseIndex INT NULL,
    ProductMainIndex INT NULL,
    ProductType INT NULL,
    DurationSeconds INT NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_WebShopProduct_IsActive DEFAULT (0),
    SortOrder INT NOT NULL CONSTRAINT DF_WebShopProduct_SortOrder DEFAULT (0),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopProduct_CreatedAt DEFAULT (SYSUTCDATETIME()),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopProduct_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_WebShopProduct_Category FOREIGN KEY (CategoryID) REFERENCES dbo.WebShopCategory(CategoryID),
    CONSTRAINT CK_WebShopProduct_Indexes CHECK
    (
      IsActive = 0 OR
      (InventoryType IS NOT NULL AND ProductBaseIndex IS NOT NULL AND ProductMainIndex IS NOT NULL)
    )
  );
END;
GO

IF OBJECT_ID(N'dbo.WebShopOrder', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopOrder
  (
    OrderID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopOrder PRIMARY KEY,
    OrderToken UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_WebShopOrder_Token DEFAULT (NEWSEQUENTIALID()),
    AccountID VARCHAR(10) NOT NULL,
    CharacterName VARCHAR(10) NULL,
    Currency CHAR(1) NOT NULL CONSTRAINT CK_WebShopOrder_Currency CHECK (Currency IN ('C','P','G')),
    TotalAmount INT NOT NULL CONSTRAINT CK_WebShopOrder_Total CHECK (TotalAmount > 0),
    Status VARCHAR(20) NOT NULL CONSTRAINT DF_WebShopOrder_Status DEFAULT ('COMPLETED'),
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopOrder_CreatedAt DEFAULT (SYSUTCDATETIME()),
    CompletedAt DATETIME2(0) NULL,
    CONSTRAINT UQ_WebShopOrder_Token UNIQUE (OrderToken),
    CONSTRAINT CK_WebShopOrder_Status CHECK (Status IN ('PENDING','COMPLETED','FAILED','CANCELLED'))
  );
END;
GO

IF OBJECT_ID(N'dbo.WebShopOrderItem', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopOrderItem
  (
    OrderItemID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopOrderItem PRIMARY KEY,
    OrderID BIGINT NOT NULL,
    ProductID INT NOT NULL,
    Quantity INT NOT NULL CONSTRAINT CK_WebShopOrderItem_Quantity CHECK (Quantity > 0),
    UnitPrice INT NOT NULL CONSTRAINT CK_WebShopOrderItem_UnitPrice CHECK (UnitPrice > 0),
    CONSTRAINT FK_WebShopOrderItem_Order FOREIGN KEY (OrderID) REFERENCES dbo.WebShopOrder(OrderID),
    CONSTRAINT FK_WebShopOrderItem_Product FOREIGN KEY (ProductID) REFERENCES dbo.WebShopProduct(ProductID)
  );
END;
GO

IF OBJECT_ID(N'dbo.WebShopDelivery', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.WebShopDelivery
  (
    DeliveryID BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_WebShopDelivery PRIMARY KEY,
    OrderID BIGINT NOT NULL,
    OrderItemID BIGINT NOT NULL,
    AccountID VARCHAR(10) NOT NULL,
    BaseItemCode INT NULL,
    DeliveryStatus VARCHAR(20) NOT NULL CONSTRAINT DF_WebShopDelivery_Status DEFAULT ('DELIVERED'),
    DeliveredAt DATETIME2(0) NOT NULL CONSTRAINT DF_WebShopDelivery_DeliveredAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT FK_WebShopDelivery_Order FOREIGN KEY (OrderID) REFERENCES dbo.WebShopOrder(OrderID),
    CONSTRAINT FK_WebShopDelivery_OrderItem FOREIGN KEY (OrderItemID) REFERENCES dbo.WebShopOrderItem(OrderItemID),
    CONSTRAINT CK_WebShopDelivery_Status CHECK (DeliveryStatus IN ('DELIVERED','FAILED','REVERSED'))
  );
END;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.WebShopCategory)
BEGIN
  INSERT dbo.WebShopCategory (Slug, Name, SortOrder) VALUES
    ('special', 'Especial', 10),
    ('accessory', 'Acessórios', 20),
    ('buff', 'Buffs', 30),
    ('pet', 'Pets', 40),
    ('equipment', 'Equipamentos', 50),
    ('ticket', 'Tickets', 60),
    ('potion', 'Poções', 70),
    ('packages', 'Pacotes', 80),
    ('services', 'Serviços de jogo', 90);
END;
GO

/* Produtos da tela do jogo. Os índices do CashShop ficam NULL até serem confirmados. */
IF NOT EXISTS (SELECT 1 FROM dbo.WebShopProduct WHERE Slug = 'gladiator-package')
BEGIN
  INSERT dbo.WebShopProduct (CategoryID, Slug, Name, Description, Currency, Price, SortOrder)
  SELECT CategoryID, 'gladiator-package', 'Gladiator Package', 'Pacote Gladiator do CashShop', 'C', 500, 10
  FROM dbo.WebShopCategory WHERE Slug = 'special';
END;
IF NOT EXISTS (SELECT 1 FROM dbo.WebShopProduct WHERE Slug = 'talisman-of-luck')
BEGIN
  INSERT dbo.WebShopProduct (CategoryID, Slug, Name, Description, Currency, Price, SortOrder)
  SELECT CategoryID, 'talisman-of-luck', 'Talisman of Luck', 'Talisman of Luck do CashShop', 'C', 100, 20
  FROM dbo.WebShopCategory WHERE Slug = 'special';
END;
GO

IF OBJECT_ID(N'dbo.WebShopPurchase', N'P') IS NOT NULL DROP PROCEDURE dbo.WebShopPurchase;
GO
CREATE PROCEDURE dbo.WebShopPurchase
  @AccountID VARCHAR(10),
  @ProductID INT,
  @Quantity INT = 1,
  @CharacterName VARCHAR(10) = NULL,
  @OrderID BIGINT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;
  SET XACT_ABORT ON;
  IF @Quantity < 1 OR @Quantity > 100 THROW 51000, 'Quantidade invalida.', 1;

  DECLARE @Currency CHAR(1), @Price INT, @Total INT, @WCoinC INT, @WCoinP INT, @GoblinPoint INT;
  DECLARE @InventoryType INT, @PackageMainIndex INT, @ProductBaseIndex INT, @ProductMainIndex INT, @ProductType INT;
  DECLARE @OrderItemID BIGINT, @i INT = 1;

  BEGIN TRANSACTION;
  SELECT @Currency = p.Currency, @Price = p.Price,
         @InventoryType = p.InventoryType, @PackageMainIndex = p.PackageMainIndex,
         @ProductBaseIndex = p.ProductBaseIndex, @ProductMainIndex = p.ProductMainIndex,
         @ProductType = p.ProductType
  FROM dbo.WebShopProduct p WITH (UPDLOCK, HOLDLOCK)
  WHERE p.ProductID = @ProductID AND p.IsActive = 1;
  IF @Price IS NULL THROW 51001, 'Produto inexistente ou inativo.', 1;
  IF @InventoryType IS NULL OR @ProductBaseIndex IS NULL OR @ProductMainIndex IS NULL THROW 51002, 'Produto ainda sem indices do CashShop.', 1;
  SET @Total = @Price * @Quantity;

  SELECT @WCoinC = ISNULL(WCoinC,0), @WCoinP = ISNULL(WCoinP,0), @GoblinPoint = ISNULL(GoblinPoint,0)
  FROM dbo.CashShopData WITH (UPDLOCK, HOLDLOCK) WHERE AccountID = @AccountID;
  IF @WCoinC IS NULL THROW 51003, 'Conta sem saldo CashShopData.', 1;
  IF (@Currency = 'C' AND @WCoinC < @Total) OR (@Currency = 'P' AND @WCoinP < @Total) OR (@Currency = 'G' AND @GoblinPoint < @Total)
    THROW 51004, 'Saldo insuficiente.', 1;

  UPDATE dbo.CashShopData SET
    WCoinC = CASE WHEN @Currency='C' THEN WCoinC-@Total ELSE WCoinC END,
    WCoinP = CASE WHEN @Currency='P' THEN WCoinP-@Total ELSE WCoinP END,
    GoblinPoint = CASE WHEN @Currency='G' THEN GoblinPoint-@Total ELSE GoblinPoint END
  WHERE AccountID = @AccountID;

  INSERT dbo.WebShopOrder (AccountID, CharacterName, Currency, TotalAmount, CompletedAt)
    VALUES (@AccountID, @CharacterName, @Currency, @Total, SYSUTCDATETIME());
  SET @OrderID = SCOPE_IDENTITY();
  INSERT dbo.WebShopOrderItem (OrderID, ProductID, Quantity, UnitPrice) VALUES (@OrderID, @ProductID, @Quantity, @Price);
  SET @OrderItemID = SCOPE_IDENTITY();

  WHILE @i <= @Quantity
  BEGIN
    INSERT dbo.CashShopInventory (MainItemCode, AccountID, InventoryType, PackageMainIndex, ProductBaseIndex, ProductMainIndex, CoinValue, ProductType)
      VALUES (0, @AccountID, @InventoryType, @PackageMainIndex, @ProductBaseIndex, @ProductMainIndex, @Price, @ProductType);
    INSERT dbo.WebShopDelivery (OrderID, OrderItemID, AccountID, BaseItemCode)
      VALUES (@OrderID, @OrderItemID, @AccountID, CONVERT(INT, SCOPE_IDENTITY()));
    SET @i += 1;
  END;
  COMMIT TRANSACTION;
END;
GO

/* Conferência após a execução. */
SELECT CategoryID, Slug, Name, IsActive FROM dbo.WebShopCategory ORDER BY SortOrder;
SELECT ProductID, Slug, Name, Currency, Price, IsActive, InventoryType, ProductBaseIndex, ProductMainIndex
FROM dbo.WebShopProduct ORDER BY SortOrder, ProductID;
GO

