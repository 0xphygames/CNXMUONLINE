import sql from 'mssql';

// Configuration from environment variables
const dbConfig: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASS || '',
  server: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'MuOnline',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERT !== 'false',
    connectTimeout: 4000,
    requestTimeout: 8000,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Global pool cache across hot reloads in Next.js development
declare global {
  var __mssqlPool: sql.ConnectionPool | undefined;
  var __mssqlAvailable: boolean | undefined;
  var __mockDbStore: MockStore | undefined;
}

// In-Memory store fallback for immediate preview / dev when real MSSQL instance is not attached
interface MockStore {
  accounts: Array<{
    memb___id: string;
    memb__passwd: string;
    mail_addr: string;
    bloc_code: string;
    appl_days?: string;
  }>;
  characters: Array<{
    AccountID: string;
    Name: string;
    cLevel: number;
    ResetCount: number;
    m_GrandReset: number;
    Class: number;
    Money: number;
    Strength: number;
    Dexterity: number;
    Vitality: number;
    Energy: number;
    LevelUpPoint?: number;
    Leadership: number;
    PkCount: number;
    PkLevel: number;
    MapNumber: number;
    MapPosX: number;
    MapPosY: number;
    GuildName?: string;
  }>;
  shopPoints: Map<string, { WCoinC: number; WCoinP: number; GoblinPoint: number }>;
  transactions: Array<{
    id: number;
    memb___id: string;
    payment_id: string;
    amount_brl: number;
    wcoin_added: number;
    status: 'pending' | 'approved' | 'cancelled';
    created_at: string;
  }>;
}

function getInitialMockStore(): MockStore {
  return {
    accounts: [
      {
        memb___id: 'admin',
        memb__passwd: '',
        mail_addr: 'admin@example.invalid',
        bloc_code: '0',
      },
      {
        memb___id: 'conqueror',
        memb__passwd: '',
        mail_addr: 'player1@example.invalid',
        bloc_code: '0',
      },
      {
        memb___id: 'valkyrie',
        memb__passwd: '',
        mail_addr: 'player2@example.invalid',
        bloc_code: '0',
      },
    ],
    characters: [
      {
        AccountID: 'conqueror',
        Name: 'LordKael',
        cLevel: 400,
        ResetCount: 98,
        m_GrandReset: 14,
        Class: 18, // Blade Master
        Money: 1850000000,
        Strength: 1800,
        Dexterity: 1200,
        Vitality: 1500,
        Energy: 400,
        Leadership: 0,
        PkCount: 0,
        PkLevel: 3,
        MapNumber: 0, // Lorencia
        MapPosX: 125,
        MapPosY: 125,
        GuildName: 'Valhalla',
      },
      {
        AccountID: 'valkyrie',
        Name: 'ArchmageNyx',
        cLevel: 400,
        ResetCount: 95,
        m_GrandReset: 12,
        Class: 2, // Grand Master
        Money: 950000000,
        Strength: 450,
        Dexterity: 800,
        Vitality: 900,
        Energy: 2400,
        Leadership: 0,
        PkCount: 0,
        PkLevel: 3,
        MapNumber: 2, // Devias
        MapPosX: 215,
        MapPosY: 45,
        GuildName: 'Valhalla',
      },
      {
        AccountID: 'admin',
        Name: 'HighQueenSylv',
        cLevel: 395,
        ResetCount: 91,
        m_GrandReset: 10,
        Class: 34, // High Elf
        Money: 450000000,
        Strength: 350,
        Dexterity: 2200,
        Vitality: 800,
        Energy: 1200,
        Leadership: 0,
        PkCount: 0,
        PkLevel: 3,
        MapNumber: 3, // Noria
        MapPosX: 172,
        MapPosY: 104,
        GuildName: 'Imperium',
      },
      {
        AccountID: 'conqueror',
        Name: 'DarthVader',
        cLevel: 400,
        ResetCount: 88,
        m_GrandReset: 9,
        Class: 66, // Lord Emperor
        Money: 620000000,
        Strength: 1400,
        Dexterity: 900,
        Vitality: 1100,
        Energy: 1200,
        Leadership: 1600,
        PkCount: 2,
        PkLevel: 4,
        MapNumber: 30, // Valley of Loren
        MapPosX: 140,
        MapPosY: 100,
        GuildName: 'Valhalla',
      },
      {
        AccountID: 'valkyrie',
        Name: 'BloodOmen',
        cLevel: 388,
        ResetCount: 84,
        m_GrandReset: 8,
        Class: 50, // Duel Master
        Money: 330000000,
        Strength: 1600,
        Dexterity: 1000,
        Vitality: 900,
        Energy: 1800,
        Leadership: 0,
        PkCount: 5,
        PkLevel: 5,
        MapNumber: 37, // Kanturu
        MapPosX: 140,
        MapPosY: 180,
        GuildName: 'Imperium',
      },
      {
        AccountID: 'admin',
        Name: 'DimensionWitch',
        cLevel: 380,
        ResetCount: 79,
        m_GrandReset: 7,
        Class: 82, // Dimension Master
        Money: 210000000,
        Strength: 300,
        Dexterity: 800,
        Vitality: 700,
        Energy: 2300,
        Leadership: 0,
        PkCount: 0,
        PkLevel: 3,
        MapNumber: 8, // Tarkan
        MapPosX: 150,
        MapPosY: 80,
        GuildName: 'DragonLords',
      },
    ],
    shopPoints: new Map([
      ['admin', { WCoinC: 50000, WCoinP: 10000, GoblinPoint: 25000 }],
      ['conqueror', { WCoinC: 7500, WCoinP: 1200, GoblinPoint: 3400 }],
      ['valkyrie', { WCoinC: 3200, WCoinP: 800, GoblinPoint: 1900 }],
    ]),
    transactions: [
      {
        id: 1,
        memb___id: 'conqueror',
        payment_id: 'pix_928172648',
        amount_brl: 50.0,
        wcoin_added: 6000,
        status: 'approved',
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 2,
        memb___id: 'valkyrie',
        payment_id: 'pix_928172649',
        amount_brl: 25.0,
        wcoin_added: 2750,
        status: 'approved',
        created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      },
    ],
  };
}

if (!global.__mockDbStore) {
  global.__mockDbStore = getInitialMockStore();
}

/**
 * Gets a singleton MSSQL connection pool.
 * Gracefully handles connection failures and returns null if MSSQL is unreachable.
 */
export async function getDbPool(): Promise<sql.ConnectionPool | null> {
  // If we already verified MSSQL is not configured or offline, skip slow reconnect timeouts
  if (global.__mssqlAvailable === false) {
    return null;
  }

  if (global.__mssqlPool && global.__mssqlPool.connected) {
    return global.__mssqlPool;
  }

  if (!process.env.DB_PASS && !process.env.DB_HOST) {
    global.__mssqlAvailable = false;
    return null;
  }

  try {
    const pool = new sql.ConnectionPool(dbConfig);
    const connectedPool = await pool.connect();
    global.__mssqlPool = connectedPool;
    global.__mssqlAvailable = true;
    console.log('[MSSQL] Conectado com sucesso ao Microsoft SQL Server (MuOnline)');
    return connectedPool;
  } catch (err) {
    console.warn('[MSSQL] Conexão com SQL Server falhou ou não configurada localmente. Utilizando Engine Season 6 Integrada:', (err as Error).message);
    global.__mssqlAvailable = false;
    return null;
  }
}

/**
 * Executes a prepared query against MSSQL or falls back to Season 6 Mock Engine
 */
export async function executeQuery<T = any>(
  queryText: string,
  parameters: Record<string, { type: sql.ISqlType; value: any }> = {}
): Promise<T[]> {
  const pool = await getDbPool();
  if (pool) {
    try {
      const request = pool.request();
      for (const [key, param] of Object.entries(parameters)) {
        request.input(key, param.type, param.value);
      }
      const result = await request.query(queryText);
      return result.recordset as T[];
    } catch (err) {
      console.error('[MSSQL Query Error]:', err);
      throw err;
    }
  }

  return [];
}

// -------------------------------------------------------------
// HIGHER-LEVEL MU ONLINE SEASON 6 DATABASE REPOSITORY METHODS
// -------------------------------------------------------------

export interface MembInfoRow {
  memb___id: string;
  memb__passwd?: string;
  mail_addr: string;
  bloc_code: string;
  appl_days?: string;
}

export interface CharacterRow {
  AccountID?: string;
  Name: string;
  cLevel: number;
  ResetCount: number;
  m_GrandReset: number;
  Class: number;
  Money: number;
  Strength: number;
  Dexterity: number;
  Vitality: number;
  Energy: number;
  LevelUpPoint?: number;
  Leadership: number;
  PkCount: number;
  PkLevel: number;
  MapNumber: number;
  MapPosX: number;
  MapPosY: number;
  GuildName?: string;
}

export interface InGameShopRow {
  memb___id: string;
  WCoinC: number;
  WCoinP: number;
  GoblinPoint: number;
}

export interface RmtTransactionRow {
  id: number;
  memb___id: string;
  payment_id: string;
  amount_brl: number;
  wcoin_added: number;
  status: 'pending' | 'approved' | 'cancelled';
  created_at: string;
}

export interface WebShopProductRow {
  ProductID: number;
  CategoryID: number;
  Slug: string;
  Name: string;
  Description?: string;
  Currency: 'C' | 'P' | 'G';
  Price: number;
  Quantity: number;
  InventoryType: number;
  PackageMainIndex?: number;
  ProductBaseIndex: number;
  ProductMainIndex: number;
  ProductType?: number;
  CategorySlug: string;
  CategoryName: string;
}

export const MuDatabase = {
  /**
   * Find account by memb___id (Prepared Statement)
   */
  async findAccount(username: string): Promise<MembInfoRow | null> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        req.input('memb___id', sql.VarChar(10), username);
        const result = await req.query<MembInfoRow>(`
          SELECT memb___id, memb__pwd AS memb__passwd, mail_addr, bloc_code, appl_days
          FROM MEMB_INFO
          WHERE memb___id = @memb___id
        `);
        return result.recordset[0] || null;
      } catch {
        // Retry with memb__passwd column variant if server uses that naming
        const req2 = pool.request();
        req2.input('memb___id', sql.VarChar(10), username);
        const result = await req2.query<MembInfoRow>(`
          SELECT memb___id, memb__passwd, mail_addr, bloc_code, appl_days
          FROM MEMB_INFO
          WHERE memb___id = @memb___id
        `);
        return result.recordset[0] || null;
      }
    }

    // Fallback Engine
    const store = global.__mockDbStore!;
    const acc = store.accounts.find((a) => a.memb___id.toLowerCase() === username.toLowerCase());
    return acc ? { ...acc } : null;
  },

  /**
   * Create account in MEMB_INFO and initialize CashShopData (Prepared Statement)
   */
  async createAccount(username: string, passwordHashOrPlain: string, email: string): Promise<boolean> {
    const pool = await getDbPool();
    if (pool) {
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        const req1 = new sql.Request(transaction);
        req1.input('memb___id', sql.VarChar(10), username);
        req1.input('memb__pwd', sql.VarChar(50), passwordHashOrPlain);
        req1.input('mail_addr', sql.VarChar(50), email);

        await req1.query(`
          INSERT INTO MEMB_INFO (memb___id, memb__pwd, mail_addr, bloc_code, ctl1_code)
          VALUES (@memb___id, @memb__pwd, @mail_addr, '0', '0')
        `);

        // Check if CashShopData exists and insert default 0 points
        const req2 = new sql.Request(transaction);
        req2.input('memb___id', sql.VarChar(10), username);
        await req2.query(`
          IF NOT EXISTS (SELECT 1 FROM CashShopData WHERE AccountID = @memb___id)
          BEGIN
            INSERT INTO CashShopData (AccountID, WCoinC, WCoinP, GoblinPoint)
            VALUES (@memb___id, 0, 0, 0)
          END
        `);

        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    // Fallback Engine
    const store = global.__mockDbStore!;
    if (store.accounts.some((a) => a.memb___id.toLowerCase() === username.toLowerCase())) {
      throw new Error('Nome de usuário já existe no servidor.');
    }

    store.accounts.push({
      memb___id: username,
      memb__passwd: passwordHashOrPlain,
      mail_addr: email,
      bloc_code: '0',
    });

    store.shopPoints.set(username, {
      WCoinC: 100, // Welcome gift
      WCoinP: 0,
      GoblinPoint: 50,
    });

    // Create a starter character for the new player
    store.characters.push({
      AccountID: username,
      Name: `${username.slice(0, 7)}Hero`,
      cLevel: 1,
      ResetCount: 0,
      m_GrandReset: 0,
      Class: 16, // Dark Knight starter
      Money: 100000,
      Strength: 28,
      Dexterity: 20,
      Vitality: 25,
      Energy: 10,
      Leadership: 0,
      PkCount: 0,
      PkLevel: 3,
      MapNumber: 0, // Lorencia
      MapPosX: 125,
      MapPosY: 125,
    });

    return true;
  },

  /**
   * Change account password (Prepared Statement)
   */
  async updatePassword(username: string, newPassword: string): Promise<boolean> {
    const pool = await getDbPool();
    if (pool) {
      const req = pool.request();
      req.input('memb___id', sql.VarChar(10), username);
      req.input('new_pwd', sql.VarChar(50), newPassword);
      try {
        await req.query(`
          UPDATE MEMB_INFO
          SET memb__pwd = @new_pwd
          WHERE memb___id = @memb___id
        `);
        return true;
      } catch {
        const req2 = pool.request();
        req2.input('memb___id', sql.VarChar(10), username);
        req2.input('new_pwd', sql.VarChar(50), newPassword);
        await req2.query(`
          UPDATE MEMB_INFO
          SET memb__passwd = @new_pwd
          WHERE memb___id = @memb___id
        `);
        return true;
      }
    }

    const store = global.__mockDbStore!;
    const acc = store.accounts.find((a) => a.memb___id.toLowerCase() === username.toLowerCase());
    if (acc) {
      acc.memb__passwd = newPassword;
      return true;
    }
    return false;
  },

  /**
   * Get WCoinC, WCoinP and GoblinPoint from CashShopData
   */
  async getShopPoints(username: string): Promise<InGameShopRow> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        req.input('memb___id', sql.VarChar(10), username);
        const result = await req.query<InGameShopRow>(`
          SELECT AccountID AS memb___id, ISNULL(WCoinC, 0) AS WCoinC, ISNULL(WCoinP, 0) AS WCoinP, ISNULL(GoblinPoint, 0) AS GoblinPoint
          FROM CashShopData
          WHERE AccountID = @memb___id
        `);
        if (result.recordset[0]) {
          return result.recordset[0];
        }
      } catch (err) {
        console.warn('[MSSQL getShopPoints error]:', err);
      }
    }

    const store = global.__mockDbStore!;
    const points = store.shopPoints.get(username) || { WCoinC: 0, WCoinP: 0, GoblinPoint: 0 };
    return {
      memb___id: username,
      ...points,
    };
  },

  async getWebShopProducts(): Promise<WebShopProductRow[]> {
    const pool = await getDbPool();
    if (pool) {
      const result = await pool.request().query<WebShopProductRow>(`
        SELECT p.ProductID, p.CategoryID, p.Slug, p.Name, p.Description,
          p.Currency, p.Price, p.Quantity, p.InventoryType, p.PackageMainIndex,
          p.ProductBaseIndex, p.ProductMainIndex, p.ProductType,
          c.Slug AS CategorySlug, c.Name AS CategoryName
        FROM dbo.WebShopProduct p
        INNER JOIN dbo.WebShopCategory c ON c.CategoryID = p.CategoryID
        WHERE p.IsActive = 1 AND c.IsActive = 1
        ORDER BY c.SortOrder, p.SortOrder, p.ProductID
      `);
      return result.recordset;
    }
    return [];
  },

  async purchaseWebShopProduct(
    username: string,
    productId: number,
    quantity: number,
    characterName?: string,
  ): Promise<{ orderId: number }> {
    const pool = await getDbPool();
    if (!pool) throw new Error('Banco de dados indisponível.');
    const req = pool.request();
    req.input('AccountID', sql.VarChar(10), username);
    req.input('ProductID', sql.Int, productId);
    req.input('Quantity', sql.Int, quantity);
    req.input('CharacterName', sql.VarChar(10), characterName || null);
    req.output('OrderID', sql.BigInt);
    await req.execute('dbo.WebShopPurchase');
    return { orderId: Number(req.parameters.OrderID.value) };
  },

  async getWebShopChest(username: string) {
    const pool = await getDbPool();
    if (!pool) return [];
    const req = pool.request();
    req.input('AccountID', sql.VarChar(10), username);
    const result = await req.query(`
      SELECT d.DeliveryID, d.OrderID, d.BaseItemCode, d.DeliveryStatus,
        d.DeliveredAt, d.ClaimedAt, p.Name, p.Slug, p.Currency, p.Price
      FROM dbo.WebShopDelivery d
      INNER JOIN dbo.WebShopOrderItem oi ON oi.OrderItemID = d.OrderItemID
      INNER JOIN dbo.WebShopProduct p ON p.ProductID = oi.ProductID
      WHERE d.AccountID = @AccountID AND d.DeliveryStatus = 'DELIVERED'
      ORDER BY d.DeliveredAt DESC
    `);
    return result.recordset;
  },

  async claimWebShopDelivery(username: string, deliveryId: number) {
    const pool = await getDbPool();
    if (!pool) throw new Error('Banco de dados indisponível.');
    const req = pool.request();
    req.input('AccountID', sql.VarChar(10), username);
    req.input('DeliveryID', sql.BigInt, deliveryId);
    await req.execute('dbo.WebShopClaimDelivery');
  },

  /**
   * Add WCoinC to account and log RMT transaction
   */
  async addWCoinAndLogPayment(
    username: string,
    wcoinAmount: number,
    paymentId: string,
    amountBRL: number
  ): Promise<boolean> {
    const pool = await getDbPool();
    if (pool) {
      const transaction = new sql.Transaction(pool);
      await transaction.begin();
      try {
        // Update or insert CashShopData
        const req1 = new sql.Request(transaction);
        req1.input('memb___id', sql.VarChar(10), username);
        req1.input('wcoin', sql.Int, wcoinAmount);
        await req1.query(`
          IF EXISTS (SELECT 1 FROM CashShopData WHERE AccountID = @memb___id)
            UPDATE CashShopData SET WCoinC = ISNULL(WCoinC, 0) + @wcoin WHERE AccountID = @memb___id;
          ELSE
            INSERT INTO CashShopData (AccountID, WCoinC, WCoinP, GoblinPoint) VALUES (@memb___id, @wcoin, 0, 0);
        `);

        // Check if RMT_Transactions table exists, if not create it
        const reqEnsure = new sql.Request(transaction);
        await reqEnsure.query(`
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RMT_Transactions' and xtype='U')
          CREATE TABLE RMT_Transactions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            memb___id VARCHAR(10) NOT NULL,
            payment_id VARCHAR(100) NOT NULL,
            amount_brl DECIMAL(10,2) NOT NULL,
            wcoin_added INT NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at DATETIME DEFAULT GETDATE()
          );
        `);

        // Insert or update transaction log
        const req2 = new sql.Request(transaction);
        req2.input('memb___id', sql.VarChar(10), username);
        req2.input('payment_id', sql.VarChar(100), paymentId);
        req2.input('amount_brl', sql.Decimal(10, 2), amountBRL);
        req2.input('wcoin_added', sql.Int, wcoinAmount);
        req2.input('status', sql.VarChar(20), 'approved');

        await req2.query(`
          IF EXISTS (SELECT 1 FROM RMT_Transactions WHERE payment_id = @payment_id)
            UPDATE RMT_Transactions SET status = 'approved' WHERE payment_id = @payment_id;
          ELSE
            INSERT INTO RMT_Transactions (memb___id, payment_id, amount_brl, wcoin_added, status, created_at)
            VALUES (@memb___id, @payment_id, @amount_brl, @wcoin_added, @status, GETDATE());
        `);

        await transaction.commit();
        return true;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    }

    // Fallback store
    const store = global.__mockDbStore!;
    const current = store.shopPoints.get(username) || { WCoinC: 0, WCoinP: 0, GoblinPoint: 0 };
    store.shopPoints.set(username, {
      ...current,
      WCoinC: current.WCoinC + wcoinAmount,
    });

    const existingTx = store.transactions.find((t) => t.payment_id === paymentId);
    if (existingTx) {
      existingTx.status = 'approved';
    } else {
      store.transactions.unshift({
        id: store.transactions.length + 1,
        memb___id: username,
        payment_id: paymentId,
        amount_brl: amountBRL,
        wcoin_added: wcoinAmount,
        status: 'approved',
        created_at: new Date().toISOString(),
      });
    }

    return true;
  },

  /**
   * Log initiated transaction in RMT_Transactions
   */
  async createPendingTransaction(
    username: string,
    paymentId: string,
    amountBRL: number,
    wcoinAmount: number
  ): Promise<void> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const reqEnsure = pool.request();
        await reqEnsure.query(`
          IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='RMT_Transactions' and xtype='U')
          CREATE TABLE RMT_Transactions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            memb___id VARCHAR(10) NOT NULL,
            payment_id VARCHAR(100) NOT NULL,
            amount_brl DECIMAL(10,2) NOT NULL,
            wcoin_added INT NOT NULL,
            status VARCHAR(20) NOT NULL,
            created_at DATETIME DEFAULT GETDATE()
          );
        `);

        const req = pool.request();
        req.input('memb___id', sql.VarChar(10), username);
        req.input('payment_id', sql.VarChar(100), paymentId);
        req.input('amount_brl', sql.Decimal(10, 2), amountBRL);
        req.input('wcoin_added', sql.Int, wcoinAmount);
        req.input('status', sql.VarChar(20), 'pending');

        await req.query(`
          INSERT INTO RMT_Transactions (memb___id, payment_id, amount_brl, wcoin_added, status, created_at)
          VALUES (@memb___id, @payment_id, @amount_brl, @wcoin_added, @status, GETDATE())
        `);
        return;
      } catch (err) {
        console.warn('[MSSQL createPendingTransaction error]:', err);
      }
    }

    const store = global.__mockDbStore!;
    store.transactions.unshift({
      id: store.transactions.length + 1,
      memb___id: username,
      payment_id: paymentId,
      amount_brl: amountBRL,
      wcoin_added: wcoinAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
    });
  },

  /**
   * Get transaction status by payment_id
   */
  async getTransaction(paymentId: string): Promise<RmtTransactionRow | null> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        req.input('payment_id', sql.VarChar(100), paymentId);
        const result = await req.query<RmtTransactionRow>(`
          SELECT id, memb___id, payment_id, amount_brl, wcoin_added, status, created_at
          FROM RMT_Transactions
          WHERE payment_id = @payment_id
        `);
        return result.recordset[0] || null;
      } catch {
        return null;
      }
    }

    const store = global.__mockDbStore!;
    const tx = store.transactions.find((t) => t.payment_id === paymentId);
    return tx || null;
  },

  /**
   * Get user's characters from Character table
   */
  async getUserCharacters(username: string): Promise<CharacterRow[]> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        req.input('AccountID', sql.VarChar(10), username);
        const result = await req.query<CharacterRow>(`
          SELECT 
            c.AccountID, c.Name, c.cLevel, 
            ISNULL(c.ResetCount, 0) AS ResetCount, 
            ISNULL(c.MasterResetCount, 0) AS m_GrandReset,
            c.Class, c.Money, c.Strength, c.Dexterity, c.Vitality, c.Energy,
            ISNULL(c.LevelUpPoint, 0) AS LevelUpPoint,
            ISNULL(c.Leadership, 0) AS Leadership,
            ISNULL(c.PkCount, 0) AS PkCount,
            ISNULL(c.PkLevel, 3) AS PkLevel,
            c.MapNumber, c.MapPosX, c.MapPosY,
            ISNULL(g.G_Name, '') AS GuildName
          FROM Character c
          LEFT JOIN GuildMember g ON c.Name = g.Name
          WHERE c.AccountID = @AccountID
          ORDER BY c.ResetCount DESC, c.cLevel DESC
        `);
        return result.recordset;
      } catch (err) {
        console.warn('[MSSQL getUserCharacters error]:', err);
      }
    }

    const store = global.__mockDbStore!;
    return store.characters.filter((c) => c.AccountID.toLowerCase() === username.toLowerCase());
  },

  /**
   * Reset Character Stats or Clear PK in Character table (Prepared Statement)
   */
  async performCharacterAction(
    username: string,
    characterName: string,
    action: 'clear_pk' | 'reset_stats' | 'unstuck'
  ): Promise<{ success: boolean; message: string }> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        req.input('AccountID', sql.VarChar(10), username);
        req.input('Name', sql.VarChar(10), characterName);

        if (action === 'clear_pk') {
          await req.query(`
            UPDATE Character
            SET PkCount = 0, PkLevel = 3
            WHERE AccountID = @AccountID AND Name = @Name
          `);
          return { success: true, message: `Status de PK do personagem ${characterName} foi limpo com sucesso!` };
        } else if (action === 'unstuck') {
          await req.query(`
            UPDATE Character
            SET MapNumber = 0, MapPosX = 125, MapPosY = 125
            WHERE AccountID = @AccountID AND Name = @Name
          `);
          return { success: true, message: `Personagem ${characterName} foi movido com sucesso para o centro de Lorencia!` };
        } else if (action === 'reset_stats') {
          await req.query(`
            UPDATE Character
            SET LevelUpPoint = ISNULL(LevelUpPoint, 0)
              + CASE WHEN Strength > 30 THEN Strength - 30 ELSE 0 END
              + CASE WHEN Dexterity > 30 THEN Dexterity - 30 ELSE 0 END
              + CASE WHEN Vitality > 30 THEN Vitality - 30 ELSE 0 END
              + CASE WHEN Energy > 30 THEN Energy - 30 ELSE 0 END,
                Strength = 30, Dexterity = 30, Vitality = 30, Energy = 30
            WHERE AccountID = @AccountID AND Name = @Name
          `);
          return { success: true, message: `Atributos de ${characterName} foram resetados com sucesso para redistribuição!` };
        }
      } catch (err) {
        return { success: false, message: (err as Error).message };
      }
    }

    const store = global.__mockDbStore!;
    const char = store.characters.find(
      (c) => c.AccountID.toLowerCase() === username.toLowerCase() && c.Name.toLowerCase() === characterName.toLowerCase()
    );

    if (!char) {
      return { success: false, message: 'Personagem não encontrado nesta conta.' };
    }

    if (action === 'clear_pk') {
      char.PkCount = 0;
      char.PkLevel = 3;
      return { success: true, message: `Status de PK do personagem ${characterName} foi limpo com sucesso!` };
    } else if (action === 'unstuck') {
      char.MapNumber = 0;
      char.MapPosX = 125;
      char.MapPosY = 125;
      return { success: true, message: `Personagem ${characterName} foi movido com sucesso para Lorencia!` };
    } else if (action === 'reset_stats') {
      char.LevelUpPoint = (char.LevelUpPoint || 0)
        + Math.max(0, char.Strength - 30)
        + Math.max(0, char.Dexterity - 30)
        + Math.max(0, char.Vitality - 30)
        + Math.max(0, char.Energy - 30);
      char.Strength = 30;
      char.Dexterity = 30;
      char.Vitality = 30;
      char.Energy = 30;
      return { success: true, message: `Atributos de ${characterName} foram resetados com sucesso!` };
    }

    return { success: false, message: 'Ação não reconhecida.' };
  },

  /**
   * Query Global Rankings (Top Resets, Top Level, Top Master, Top Guilds, Castle Siege)
   */
  async getRankings(category: 'resets' | 'resets_daily' | 'resets_weekly' | 'resets_monthly' | 'level' | 'master' | 'guilds' | 'siege', classCodes?: number[]): Promise<any[]> {
    const pool = await getDbPool();
    if (pool) {
      try {
        const req = pool.request();
        (classCodes || []).forEach((code, index) => req.input(`classCode${index}`, code));
        const classFilter = classCodes?.length ? ` AND c.Class IN (${classCodes.map((_, index) => `@classCode${index}`).join(', ')})` : '';
        if (category === 'resets' || category.startsWith('resets_')) {
          if (category !== 'resets') {
            await req.query(`
              IF OBJECT_ID('dbo.MU_ResetHistory', 'U') IS NULL
              CREATE TABLE dbo.MU_ResetHistory (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                CharacterName VARCHAR(10) NOT NULL,
                ResetCount INT NOT NULL DEFAULT 1,
                CreatedAt DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
              )
            `);
            const period = category === 'resets_daily' ? 'DAY' : category === 'resets_monthly' ? 'MONTH' : null;
            const periodFilter = period
              ? `h.CreatedAt >= DATEADD(${period}, DATEDIFF(${period}, 0, SYSUTCDATETIME()), 0)`
              : `h.CreatedAt >= DATEADD(DAY, -7, SYSUTCDATETIME())`;
            const result = await req.query(`
              SELECT TOP 50
                h.CharacterName AS Name,
                SUM(h.ResetCount) AS ResetCount,
                ISNULL(c.cLevel, 0) AS cLevel,
                ISNULL(c.Class, 0) AS Class,
                ISNULL(g.G_Name, '-') AS GuildName,
                ISNULL(c.MasterResetCount, 0) AS m_GrandReset
              FROM dbo.MU_ResetHistory h
              LEFT JOIN Character c ON c.Name = h.CharacterName
              LEFT JOIN GuildMember g ON c.Name = g.Name
              WHERE ${periodFilter}${classFilter}
              GROUP BY h.CharacterName, c.cLevel, c.Class, g.G_Name, c.MasterResetCount
              ORDER BY SUM(h.ResetCount) DESC, MAX(h.CreatedAt) ASC
            `);
            return result.recordset;
          }
          const result = await req.query(`
            SELECT TOP 50 
              c.Name, c.cLevel, 
              ISNULL(c.ResetCount, 0) AS ResetCount, 
              ISNULL(c.MasterResetCount, 0) AS m_GrandReset, 
              c.Class, 
              ISNULL(g.G_Name, '-') AS GuildName
            FROM Character c
            LEFT JOIN GuildMember g ON c.Name = g.Name
            WHERE 1 = 1${classFilter}
            ORDER BY c.MasterResetCount DESC, c.ResetCount DESC, c.cLevel DESC
          `);
          return result.recordset;
        } else if (category === 'level') {
          const result = await req.query(`
            SELECT TOP 50 
              c.Name, c.cLevel, 
              ISNULL(c.ResetCount, 0) AS ResetCount, 
              c.Class, 
              ISNULL(g.G_Name, '-') AS GuildName
            FROM Character c
            LEFT JOIN GuildMember g ON c.Name = g.Name
            WHERE 1 = 1${classFilter}
            ORDER BY c.cLevel DESC, c.ResetCount DESC
          `);
          return result.recordset;
        } else if (category === 'master') {
          const result = await req.query(`
            SELECT TOP 50
              c.Name, ISNULL(c.MasterResetCount, 0) AS MasterLevel,
              ISNULL(c.cLevel, 0) AS cLevel, ISNULL(c.ResetCount, 0) AS ResetCount,
              ISNULL(c.MasterResetCount, 0) AS m_GrandReset, c.Class,
              ISNULL(g.G_Name, '-') AS GuildName
            FROM Character c
            LEFT JOIN GuildMember g ON c.Name = g.Name
            WHERE 1 = 1${classFilter}
            ORDER BY c.MasterResetCount DESC, c.cLevel DESC, c.ResetCount DESC
          `);
          return result.recordset;
        } else if (category === 'guilds') {
          const result = await req.query(`
            SELECT TOP 20 
              G_Name AS Name, 
              G_Master AS Master, 
              G_Score AS Score, 
              G_Count AS Members
            FROM Guild
            ORDER BY G_Score DESC
          `);
          return result.recordset;
        } else if (category === 'siege') {
          const result = await req.query(`
            SELECT TOP 1
              ISNULL(d.OWNER_GUILD, '-') AS OwnerGuild,
              ISNULL(g.G_Master, '-') AS Master,
              ISNULL(d.SIEGE_END_DATE, NULL) AS SiegeEndDate,
              ISNULL(d.SIEGE_START_DATE, NULL) AS SiegeStartDate
            FROM MuCastle_DATA d
            LEFT JOIN Guild g ON g.G_Name = d.OWNER_GUILD
            WHERE d.MAP_SVR_GROUP = 0
          `);
          return result.recordset;
        }
      } catch (err) {
        console.error('[MSSQL Rankings Query Error]:', err);
        throw err;
      }
    }

    if (category === 'master' || category === 'siege') return [];

    throw new Error('Banco de dados indisponível: ranking não carregado');
  },

  /**
   * Server general statistics
   */
  async getServerStats() {
    let onlinePlayers = 0;
    let onlinePlayersSource: 'sql' | 'unavailable' = 'unavailable';

    const pool = await getDbPool();
    if (pool) {
      try {
        const result = await pool.request().query<{ onlinePlayers: number }>(`
          SELECT COUNT(*) AS onlinePlayers
          FROM MEMB_STAT
          WHERE ConnectStat = 1
        `);
        onlinePlayers = Number(result.recordset[0]?.onlinePlayers ?? 0);
        onlinePlayersSource = 'sql';
      } catch (err) {
        console.warn('[MSSQL Online Count Error]:', (err as Error).message);
      }
    }

    return {
      serverName: 'MU ONLINE SEASON 6',
      subTitle: 'Classic Hard & Dynamic Engine',
      version: 'Season 6 Episode 3',
      experience: '20x ~ 5x (Dinâmica)',
      dropRate: '20%',
      onlinePlayers,
      onlinePlayersSource,
      maxOnline: 1500,
      totalAccounts: 3824,
      totalCharacters: 7912,
      totalGuilds: 142,
      connectServerStatus: 'Online',
      gameServer1Status: 'Online (Sub-1 PVP)',
      gameServer2Status: 'Online (Sub-2 VIP)',
      castleSiegeOwner: 'Valhalla',
      castleSiegeMaster: 'LordKael',
    };
  },
};

export default MuDatabase;

