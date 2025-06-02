const eventData = {
    user_id: 11,
    device_id: "ios",
    version: "1747643239421-2wi8sr8yr",
    session_id: "1747643239421-g28qurlzy",
    event_list: [
      {
        event_name: "launch",  // app启动
        page_name: null,
        event_properties: [
          {
            is_open: 1, // 1: 正常打开 0: app崩溃
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "login",  // 登录
        page_name: "login", // 登录页面
        event_properties: [
          {
            is_login: 1,
            login_method: "phone",  // facebook, google, phone, email, apple
            user_name: "1234567890", // 用户名称
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "register",  // 注册
        page_name: "register", // 注册页面
        event_properties: [
          {
            is_register: 1,
            user_name: "1234567890", // 用户名称
            register_method: "phone", // facebook, google, phone, email, apple
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "search",  // 搜索
        page_name: "search", // 搜索页面
        event_properties: [
          {
            search_keyword: "1234567890", // 搜索关键词
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "product",  // 商品
        page_name: "product", // 商品页面
        event_properties: [
          {
            offer_id: 892906753556, // 商品ID
            category_id: 1037036, // 商品分类ID
            price: 2.17, // 商品价格
            currency: "FCFA", // FCFA, USD, CDF,CFA,EUR,
            timestamp: "2025-05-19 08:27:21",
            product_name: "瑜伽服女夏天排汗瑜伽服大码胖速干衣跑步套装女晨跑运动套装女", // 商品名称
            product_img:
              "https://cbu01.alicdn.com/img/ibank/O1CN01KvfDVh1UL3CWndJ89_!!2219347832500-0-cib.jpg", // 商品图片
          },
        ],
      },
      {
        event_name: "category",  // 分类
        page_name: "category", // 分类页面
        event_properties: [
          {
            category_id: "1234567890", // 分类ID
            timestamp: "2025-05-19 08:27:21",
            category_name: "食品酒水", // 分类名称
            level: 1, // 分类级别
          },
        ],
      },
      {
        event_name: "productList",  // 商品列表
        page_name: "productList", // 商品列表页面
        event_properties: [
          {
            category_id: "133", // 分类ID
            category_name: "农业用品", // 分类名称
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "addToCart",  // 添加到购物车
        page_name: "addToCart", // 添加到购物车页面
        event_properties: [
          {
            offer_id: 892906753556, // 商品ID
            category_id: 1037036, // 商品分类ID
            price: 2.17, // 商品价格
            quality: 1, // 商品数量
            currency: "FCFA",  // FCFA, USD, CDF,CFA,EUR,
            timestamp: "2025-05-19 08:27:21",
            product_name: "瑜伽服女夏天排汗瑜伽服大码胖速干衣跑步套装女晨跑运动套装女", // 商品名称
            product_img:
              "https://cbu01.alicdn.com/img/ibank/O1CN01KvfDVh1UL3CWndJ89_!!2219347832500-0-cib.jpg", // 商品图片
          },
          {
            offer_id: 892906753557, // 商品ID
            category_id: 1037036, // 商品分类ID
            price: 2.17, // 商品价格
            quality: 2, // 商品数量
            currency: "FCFA", // FCFA, USD, CDF,CFA,EUR,
            timestamp: "2025-05-19 08:27:21",
            product_name: "瑜伽服女夏天排汗瑜伽服大码胖速干衣跑步套装女晨跑运动套装女", // 商品名称
            product_img:
              "https://cbu01.alicdn.com/img/ibank/O1CN01KvfDVh1UL3CWndJ89_!!2219347832500-0-cib.jpg",
          },
        ],
      },
      {
        event_name: "address",  // 地址
        page_name: "address", // 地址页面
        event_properties: [
          {
            last_name: "san", // 姓
            first_name: "zhang", // 名
            country: "chinese", // 国家
            phone: 10086, // 手机号
            whatsapp: 10086, // whatsapp号
            timestamp: "2025-05-12 00:00:30",
          },
        ],
      },
      {
        event_name: "shipping",
        page_name: "shipping",
        event_properties: [
          {
            shipping_method: 0, // 运输方式 // 0 船运 1 空运
            shipping_price_outside: 40, // 国际运输价格
            shipping_price_within: 20, // 国内运输价格
            currency: "FCFA", // FCFA, USD, CDF,CFA,EUR,
            forwarder_name: "达菲物流", // 货代中心  // 欧万物流 //303仓库
            country_city: "Congo-Kinshasa", // 国家-城市
            timestamp: "2025-05-12 00:00:30",
          },
        ],
      },
      {
        event_name: "payment",  // 支付
        page_name: "payment", // 支付页面
        event_properties: [
          {
            pay_method: "palpay", //支付方式 // palpay, mobile_money, wave, bank_card balance
            online: 1,  //线上或线下 // 1 线上支付 0 线下支付
            all_price: 519.8, // 总价格
            currency: "FCFA", // FCFA, USD, CDF,CFA,EUR,
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "order",  // 订单
        page_name: "order", // 订单页面
        event_properties: [
          {
            order_id: "1234567890", // 订单ID
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
      {
        event_name: "checkout",  // 结算
        page_name: "checkout", // 结算页面
        event_properties: [
          {
            is_suc: 1, // 是否成功 1 成功 0 失败
            all_price: 519.8, // 总价格
            currency: "FCFA", // FCFA, USD, CDF,CFA,EUR,
            timestamp: "2025-05-12 00:00:30",
            shipping_method: 0, // 0 船运 1 空运
            shipping_price_outside: 40, // 国际运输价格
            shipping_price_within: 20, // 国内运输价格
          },
        ],
      },
      {
        event_name: "purchase",  // 购买
        page_name: "purchase", // 购买页面
        event_properties: [
          {
            order_id: "1234567890", // 订单ID
            is_suc: 1, // 是否成功 1 成功 
            timestamp: "2025-05-19 08:27:21",
          },
        ],
      },
    ],
  };