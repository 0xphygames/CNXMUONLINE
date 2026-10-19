/* Catálogo extraído de Cliente\Data\CashShop\CashShopProduct.txt e CashShopPackage.txt. */
USE [MuOnlineS6];
GO
SET NOCOUNT ON;
GO

DECLARE @Products TABLE
(
  Slug VARCHAR(80), Name VARCHAR(120), CategorySlug VARCHAR(40),
  Currency CHAR(1), Price INT, InventoryType INT, PackageMainIndex INT,
  ProductBaseIndex INT, ProductMainIndex INT, ProductType INT, SortOrder INT
);

INSERT @Products VALUES
('bundled-jewel-bless','Bundled Jewel of Bless','consumables','C',30,83,100,1000,1000,80,10),
('bundled-jewel-soul','Bundled Jewel of Soul','consumables','C',30,83,101,1010,1010,80,20),
('jewel-full','Jewel of Full','consumables','C',1500,83,132,1320,1320,80,30),
('jewel-level','Jewel of Level','consumables','C',1500,83,133,1330,1330,80,40),
('wings-spirits','Wings of Spirits','equipment','C',400,83,102,1020,1020,80,10),
('wings-soul','Wings of Soul','equipment','C',400,83,103,1030,1030,80,20),
('wings-dragon','Wings of Dragon','equipment','C',400,83,104,1040,1040,80,30),
('wings-darkness','Wings of Darkness','equipment','C',400,83,105,1050,1050,80,40),
('wind-despair','Wind of Despair','equipment','C',400,83,106,1060,1060,80,50),
('cloak-warrior','Cloak of Warrior','equipment','C',400,83,107,1070,1070,80,60),
('cape-lord','Cape of Lord','equipment','C',400,83,108,1080,1080,80,70),
('ring-ice','Ring of Ice','accessory','C',400,83,109,1090,1090,80,10),
('ring-poison','Ring of Poison','accessory','C',400,83,110,1100,1100,80,20),
('ring-wind','Ring of Wind','accessory','C',400,83,111,1110,1110,80,30),
('ring-magic','Ring of Magic','accessory','C',400,83,112,1120,1120,80,40),
('ring-earth','Ring of Earth','accessory','C',400,83,113,1130,1130,80,50),
('ring-fire','Ring of Fire','accessory','C',400,83,114,1140,1140,80,60),
('pendant-lighting','Pendant of Lighting','accessory','C',400,83,119,1190,1190,80,70),
('pendant-fire','Pendant of Fire','accessory','C',400,83,120,1200,1200,80,80),
('pendant-ice','Pendant of Ice','accessory','C',400,83,121,1210,1210,80,90),
('demon','Demon','pet','C',50,83,126,1260,1260,80,10),
('spirit-guardian','Spirit of Guardian','pet','C',50,83,127,1270,1270,80,20),
('pet-rudolf','Pet Rudolf','pet','C',50,83,128,1280,1280,80,30),
('pet-panda','Pet Panda','pet','C',30,83,129,1290,1290,80,40),
('pet-unicorn','Pet Unicorn','pet','C',50,83,130,1300,1300,80,50),
('pet-skeleton','Pet Skeleton','pet','C',30,83,131,1310,1310,80,60),
('horn-dinorant','Horn of Dinorant','pet','C',100,83,134,1340,1340,80,70),
('horn-fenrir','Horn of Fenrir','pet','C',100,83,135,1350,1350,80,80),
('wing-storm','Wing of Storm','equipment','C',130,83,138,1380,1380,80,80),
('wing-eternal','Wing of Eternal','equipment','C',130,83,139,1390,1390,80,90),
('wing-illusion','Wing of Illusion','equipment','C',130,83,140,1400,1400,80,100),
('wing-ruin','Wing of Ruin','equipment','C',130,83,141,1410,1410,80,110),
('cape-emperor','Cape of Emperor','equipment','C',130,83,142,1420,1420,80,120),
('wing-dimension','Wing of Dimension','equipment','C',130,83,143,1430,1430,80,130),
('lord-cape','Lord of the Cape','equipment','C',130,83,144,1440,1440,80,140);

DECLARE @Slug VARCHAR(80), @Name VARCHAR(120), @CategorySlug VARCHAR(40), @CategoryID INT,
        @Currency CHAR(1), @Price INT, @InventoryType INT, @PackageMainIndex INT,
        @ProductBaseIndex INT, @ProductMainIndex INT, @ProductType INT, @SortOrder INT;

DECLARE product_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT * FROM @Products;
OPEN product_cursor;
FETCH NEXT FROM product_cursor INTO @Slug,@Name,@CategorySlug,@Currency,@Price,@InventoryType,@PackageMainIndex,@ProductBaseIndex,@ProductMainIndex,@ProductType,@SortOrder;
WHILE @@FETCH_STATUS = 0
BEGIN
  SELECT @CategoryID = CategoryID FROM dbo.WebShopCategory WHERE Slug = @CategorySlug;
  IF @CategoryID IS NULL
  BEGIN
    INSERT dbo.WebShopCategory (Slug,Name,SortOrder) VALUES (@CategorySlug,@CategorySlug,100);
    SET @CategoryID = SCOPE_IDENTITY();
  END;
  IF EXISTS (SELECT 1 FROM dbo.WebShopProduct WHERE Slug=@Slug)
    UPDATE dbo.WebShopProduct SET CategoryID=@CategoryID, Name=@Name, Currency=@Currency, Price=@Price,
      InventoryType=@InventoryType, PackageMainIndex=@PackageMainIndex, ProductBaseIndex=@ProductBaseIndex,
      ProductMainIndex=@ProductMainIndex, ProductType=@ProductType, IsActive=1, SortOrder=@SortOrder, UpdatedAt=SYSUTCDATETIME()
      WHERE Slug=@Slug;
  ELSE
    INSERT dbo.WebShopProduct (CategoryID,Slug,Name,Currency,Price,InventoryType,PackageMainIndex,ProductBaseIndex,ProductMainIndex,ProductType,IsActive,SortOrder)
      VALUES (@CategoryID,@Slug,@Name,@Currency,@Price,@InventoryType,@PackageMainIndex,@ProductBaseIndex,@ProductMainIndex,@ProductType,1,@SortOrder);
  FETCH NEXT FROM product_cursor INTO @Slug,@Name,@CategorySlug,@Currency,@Price,@InventoryType,@PackageMainIndex,@ProductBaseIndex,@ProductMainIndex,@ProductType,@SortOrder;
END;
CLOSE product_cursor;
DEALLOCATE product_cursor;
GO

SELECT ProductID,Name,Currency,Price,InventoryType,PackageMainIndex,ProductBaseIndex,ProductMainIndex,IsActive
FROM dbo.WebShopProduct WHERE IsActive=1 ORDER BY CategoryID,SortOrder,ProductID;
GO

