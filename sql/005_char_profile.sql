-- Perfil público de personagem: VIP e modo invisível.
-- Tabelas próprias do site. Não altera as tabelas do jogo (Character, MEMB_INFO, etc.).

IF OBJECT_ID('dbo.SiteVipAccount', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.SiteVipAccount (
    AccountID   VARCHAR(10)  NOT NULL PRIMARY KEY,
    VipUntil    DATETIME2    NOT NULL,
    UpdatedAt   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
  );
END
GO

IF OBJECT_ID('dbo.SiteCharPrivacy', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.SiteCharPrivacy (
    CharName    VARCHAR(10)  NOT NULL PRIMARY KEY,
    AccountID   VARCHAR(10)  NOT NULL,
    Invisible   BIT          NOT NULL DEFAULT 0,
    UpdatedAt   DATETIME2    NOT NULL DEFAULT SYSUTCDATETIME()
  );
  CREATE INDEX IX_SiteCharPrivacy_AccountID ON dbo.SiteCharPrivacy (AccountID);
END
GO
