/*
 * ============================================================
 * CỬA HÀNG SANG TRỌNG
 * - Nằm trong menu xổ xuống của Cửa hàng
 * - Cùng vị trí với mục Sưu tầm
 * - Vật phẩm được thêm THỦ CÔNG bằng ID
 * ============================================================
 */

(() => {
    'use strict';

    window.__LUXURY_STORE_GUARD_BUILD = '20260917.v1-D1-D8';


    // EFFECT QUALITY MANAGER v1.2.0
    // Dùng chung cho toàn bộ runtime Luxury/Premium, kể cả vật phẩm thêm sau này.
    function getLuxuryQualityCount(baseCount, minimum = 1) {
        const base = Math.max(0, Number(baseCount) || 0);
        try {
            const manager = window.EffectQualityManager;
            if (manager && typeof manager.getRecommendedCount === 'function') {
                const policy = manager.getLuxuryPolicy?.();
                const next = policy ? Math.ceil(base * policy.countScale) : manager.getRecommendedCount(base);
                return base > 0 ? Math.max(minimum, next) : 0;
            }
        } catch (_) {}
        return Math.ceil(base);
    }

    // ========================================================
    // 1. DANH SÁCH VẬT PHẨM SANG TRỌNG
    // ========================================================
    // Muốn món nào xuất hiện thì ghi ID món đó vào đây.
    const LUXURY_ITEM_IDS = [
        'pet_luxury_mua_xuan',
        'pet_luxury_mua_ha',
        'pet_luxury_mua_thu',
        'pet_hac_mong_2',
        'pet_quoc_khanh_1',
        'pet_mythic_nyx_1',
        'pet_mythic_aether_1',
        'pet_dem_day_sao_1',
        'pet_lotm_klein_event_1',
        'pet_cam_co_cam_mong_1',
        'pet_tamon_b_side_1',
        'pet_tamon_b_side_2',
        'pet_trung_thu_nguyet_cung_tien_tu',
        'pet_trung_thu_chu_cuoi_2',
        'pet_linkclick_cheng_xiaoshi_1'
    ];

    // ========================================================
    // VẬT PHẨM PREMIUM THỦ CÔNG
    // ========================================================

    // ========================================================
    // QUỐC KHÁNH · HÀO KHÍ VIỆT NAM
    // - Chỉ nhận từ sự kiện Lịch sử hào hùng.
    // - Không mua / không dùng thử bằng Coin.
    // - Vật phẩm Luxury 10/10.
    // ========================================================
    // MÙA THU · HỔ PHÁCH PHONG DIỆP — full suite owned only by this pet.
    const AUTUMN_PREMIUM_PET = {
        id: 'pet_luxury_mua_thu', name: 'Thu Thần · Hổ Phách Phong Diệp',
        type: 'pet', price: 14000, isNonCoin: false, luxuryOnly: true, eventOnly: false,
        tag: 'Mùa thu', tags: ['Mùa thu', 'Bốn mùa', 'Premium'],
        image: 'assets/Premium/Bốn mùa/thu_nhan_vat3.png',
        asset: 'assets/Premium/Bốn mùa/thu_nhan_vat3.png',
        value: 'assets/Premium/Bốn mùa/thu_nhan_vat3.png',
        luxuryTagImage: 'assets/Premium/Bốn mùa/tag3.png', isIcon: false,
        petEffect: 'autumn3-pet-magic', premiumSuite: 'autumn3-amber-sanctuary',
        premiumLayers: ['world-effect', 'interface', 'pet-realm', 'global-click', 'ultimate'],
        disableClickEffect: true
    };

    function ensureAutumnStylesheet() {
        let link = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(node => /\/premium-mua-thu\.css(?:[?#]|$)/.test(node.href));
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/premium-mua-thu.css?v=20260927.realms10';
            document.head.appendChild(link);
        }
        link.id = 'autumn3-premium-style';
        return link;
    }

    const LUX_ART10 = {"rose":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g class=\"r10-rig\" fill=\"none\"><path d=\"M70 700V70H1530V700\"/><path d=\"M130 700V95H1470V700\"/><path d=\"M190 700V120H1410V700\"/><path d=\"M250 700V145H1350V700\"/><path d=\"M310 700V170H1290V700\"/><path d=\"M100 75l26 45 26-45\"/><path d=\"M152 75l26 45 26-45\"/><path d=\"M204 75l26 45 26-45\"/><path d=\"M256 75l26 45 26-45\"/><path d=\"M308 75l26 45 26-45\"/><path d=\"M360 75l26 45 26-45\"/><path d=\"M412 75l26 45 26-45\"/><path d=\"M464 75l26 45 26-45\"/><path d=\"M516 75l26 45 26-45\"/><path d=\"M568 75l26 45 26-45\"/><path d=\"M620 75l26 45 26-45\"/><path d=\"M672 75l26 45 26-45\"/><path d=\"M724 75l26 45 26-45\"/><path d=\"M776 75l26 45 26-45\"/><path d=\"M828 75l26 45 26-45\"/><path d=\"M880 75l26 45 26-45\"/><path d=\"M932 75l26 45 26-45\"/><path d=\"M984 75l26 45 26-45\"/><path d=\"M1036 75l26 45 26-45\"/><path d=\"M1088 75l26 45 26-45\"/><path d=\"M1140 75l26 45 26-45\"/><path d=\"M1192 75l26 45 26-45\"/><path d=\"M1244 75l26 45 26-45\"/><path d=\"M1296 75l26 45 26-45\"/><path d=\"M1348 75l26 45 26-45\"/><path d=\"M1400 75l26 45 26-45\"/><path d=\"M1452 75l26 45 26-45\"/><path d=\"M1504 75l26 45 26-45\"/></g><g class=\"r10-beams\"><path style=\"--i:0\" d=\"M100 95L-260 850H220Z\"/><path style=\"--i:1\" d=\"M225 95L-120 850H350Z\"/><path style=\"--i:2\" d=\"M350 95L20 850H480Z\"/><path style=\"--i:3\" d=\"M475 95L160 850H610Z\"/><path style=\"--i:4\" d=\"M600 95L300 850H740Z\"/><path style=\"--i:5\" d=\"M725 95L440 850H870Z\"/><path style=\"--i:6\" d=\"M850 95L580 850H1000Z\"/><path style=\"--i:7\" d=\"M975 95L720 850H1130Z\"/><path style=\"--i:8\" d=\"M1100 95L860 850H1260Z\"/><path style=\"--i:9\" d=\"M1225 95L1000 850H1390Z\"/><path style=\"--i:10\" d=\"M1350 95L1140 850H1520Z\"/><path style=\"--i:11\" d=\"M1475 95L1280 850H1650Z\"/></g><g class=\"r10-speakers\"><g transform=\"translate(65 180)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(65 303)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(65 426)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(65 549)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(1455 180)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(1455 303)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(1455 426)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g><g transform=\"translate(1455 549)\"><rect width=\"80\" height=\"110\" rx=\"14\"/><circle cx=\"40\" cy=\"60\" r=\"28\"/><circle cx=\"40\" cy=\"60\" r=\"10\"/></g></g><g class=\"r10-runway\"><path d=\"M640 470H960L1400 900H200Z\"/><path class=\"\" d=\"M640 470H960\"/><path class=\"\" d=\"M610 502H990\"/><path class=\"\" d=\"M580 534H1020\"/><path class=\"\" d=\"M550 566H1050\"/><path class=\"\" d=\"M520 598H1080\"/><path class=\"\" d=\"M490 630H1110\"/><path class=\"\" d=\"M460 662H1140\"/><path class=\"\" d=\"M430 694H1170\"/><path class=\"\" d=\"M400 726H1200\"/><path class=\"\" d=\"M370 758H1230\"/><path class=\"\" d=\"M340 790H1260\"/><path class=\"\" d=\"M310 822H1290\"/><path class=\"\" d=\"M280 854H1320\"/><path class=\"\" d=\"M250 886H1350\"/><path class=\"\" d=\"M640 470L200 900\"/><path class=\"\" d=\"M680 470L350 900\"/><path class=\"\" d=\"M720 470L500 900\"/><path class=\"\" d=\"M760 470L650 900\"/><path class=\"\" d=\"M800 470L800 900\"/><path class=\"\" d=\"M840 470L950 900\"/><path class=\"\" d=\"M880 470L1100 900\"/><path class=\"\" d=\"M920 470L1250 900\"/><path class=\"\" d=\"M960 470L1400 900\"/></g><g class=\"r10-rose\"><path transform=\"rotate(0 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(22.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(45 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(67.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(90 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(112.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(135 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(157.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(180 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(202.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(225 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(247.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(270 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(292.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(315 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><path transform=\"rotate(337.5 800 345)\" d=\"M800 345C530 70 760 70 800 160C860 60 1080 130 800 345Z\"/><circle cx=\"800\" cy=\"345\" r=\"45\"/></g><g class=\"r10-eq\"><rect style=\"--i:0\" x=\"220\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:1\" x=\"238\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:2\" x=\"256\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:3\" x=\"274\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:4\" x=\"292\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:5\" x=\"310\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:6\" x=\"328\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:7\" x=\"346\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:8\" x=\"364\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:9\" x=\"382\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:10\" x=\"400\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:11\" x=\"418\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:12\" x=\"436\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:13\" x=\"454\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:14\" x=\"472\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:15\" x=\"490\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:16\" x=\"508\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:17\" x=\"526\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:18\" x=\"544\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:19\" x=\"562\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:20\" x=\"580\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:21\" x=\"598\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:22\" x=\"616\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:23\" x=\"634\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:24\" x=\"652\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:25\" x=\"670\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:26\" x=\"688\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:27\" x=\"706\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:28\" x=\"724\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:29\" x=\"742\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:30\" x=\"760\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:31\" x=\"778\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:32\" x=\"796\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:33\" x=\"814\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:34\" x=\"832\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:35\" x=\"850\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:36\" x=\"868\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:37\" x=\"886\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:38\" x=\"904\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:39\" x=\"922\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:40\" x=\"940\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:41\" x=\"958\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:42\" x=\"976\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:43\" x=\"994\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:44\" x=\"1012\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:45\" x=\"1030\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:46\" x=\"1048\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:47\" x=\"1066\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:48\" x=\"1084\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:49\" x=\"1102\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:50\" x=\"1120\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:51\" x=\"1138\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:52\" x=\"1156\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:53\" x=\"1174\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:54\" x=\"1192\" y=\"640\" width=\"8\" height=\"30\"/><rect style=\"--i:55\" x=\"1210\" y=\"626\" width=\"8\" height=\"44\"/><rect style=\"--i:56\" x=\"1228\" y=\"612\" width=\"8\" height=\"58\"/><rect style=\"--i:57\" x=\"1246\" y=\"598\" width=\"8\" height=\"72\"/><rect style=\"--i:58\" x=\"1264\" y=\"584\" width=\"8\" height=\"86\"/><rect style=\"--i:59\" x=\"1282\" y=\"570\" width=\"8\" height=\"100\"/><rect style=\"--i:60\" x=\"1300\" y=\"556\" width=\"8\" height=\"114\"/><rect style=\"--i:61\" x=\"1318\" y=\"542\" width=\"8\" height=\"128\"/><rect style=\"--i:62\" x=\"1336\" y=\"528\" width=\"8\" height=\"142\"/><rect style=\"--i:63\" x=\"1354\" y=\"640\" width=\"8\" height=\"30\"/></g><g class=\"r10-confetti\"><path style=\"--i:0\" transform=\"translate(0 0) rotate(0)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:1\" transform=\"translate(197 113) rotate(37)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:2\" transform=\"translate(394 226) rotate(74)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:3\" transform=\"translate(591 339) rotate(111)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:4\" transform=\"translate(788 452) rotate(148)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:5\" transform=\"translate(985 565) rotate(185)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:6\" transform=\"translate(1182 678) rotate(222)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:7\" transform=\"translate(1379 91) rotate(259)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:8\" transform=\"translate(1576 204) rotate(296)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:9\" transform=\"translate(173 317) rotate(333)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:10\" transform=\"translate(370 430) rotate(370)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:11\" transform=\"translate(567 543) rotate(407)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:12\" transform=\"translate(764 656) rotate(444)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:13\" transform=\"translate(961 69) rotate(481)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:14\" transform=\"translate(1158 182) rotate(518)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:15\" transform=\"translate(1355 295) rotate(555)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:16\" transform=\"translate(1552 408) rotate(592)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:17\" transform=\"translate(149 521) rotate(629)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:18\" transform=\"translate(346 634) rotate(666)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:19\" transform=\"translate(543 47) rotate(703)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:20\" transform=\"translate(740 160) rotate(740)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:21\" transform=\"translate(937 273) rotate(777)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:22\" transform=\"translate(1134 386) rotate(814)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:23\" transform=\"translate(1331 499) rotate(851)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:24\" transform=\"translate(1528 612) rotate(888)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:25\" transform=\"translate(125 25) rotate(925)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:26\" transform=\"translate(322 138) rotate(962)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:27\" transform=\"translate(519 251) rotate(999)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:28\" transform=\"translate(716 364) rotate(1036)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:29\" transform=\"translate(913 477) rotate(1073)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:30\" transform=\"translate(1110 590) rotate(1110)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:31\" transform=\"translate(1307 3) rotate(1147)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:32\" transform=\"translate(1504 116) rotate(1184)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:33\" transform=\"translate(101 229) rotate(1221)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:34\" transform=\"translate(298 342) rotate(1258)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:35\" transform=\"translate(495 455) rotate(1295)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:36\" transform=\"translate(692 568) rotate(1332)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:37\" transform=\"translate(889 681) rotate(1369)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:38\" transform=\"translate(1086 94) rotate(1406)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:39\" transform=\"translate(1283 207) rotate(1443)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:40\" transform=\"translate(1480 320) rotate(1480)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:41\" transform=\"translate(77 433) rotate(1517)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:42\" transform=\"translate(274 546) rotate(1554)\" d=\"M0 0l12 8-5 20-11-7Z\"/><path style=\"--i:43\" transform=\"translate(471 659) rotate(1591)\" d=\"M0 0l12 8-5 20-11-7Z\"/></g></svg>","cat":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g class=\"c10-cables\" fill=\"none\"><path class=\"\" d=\"M-50 70Q800 5001650 80\"/><path class=\"\" d=\"M-50 96Q800 5221650 110\"/><path class=\"\" d=\"M-50 122Q800 5441650 140\"/><path class=\"\" d=\"M-50 148Q800 5661650 170\"/><path class=\"\" d=\"M-50 174Q800 5881650 200\"/><path class=\"\" d=\"M-50 200Q800 6101650 230\"/><path class=\"\" d=\"M-50 226Q800 6321650 260\"/></g><g class=\"c10-city\"><g transform=\"translate(-40 340)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(28 411)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(96 482)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(164 553)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(232 404)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(300 475)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(368 546)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(436 397)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(504 468)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(572 539)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(640 390)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(708 461)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(776 532)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(844 383)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(912 454)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(980 525)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1048 376)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1116 447)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1184 518)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1252 369)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1320 440)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1388 511)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1456 362)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1524 433)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g><g transform=\"translate(1592 504)\"><path d=\"M0 350V50L30 10 60 50V350Z\"/><rect x=\"8\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"70\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"112\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"154\" width=\"8\" height=\"19\"/><rect x=\"8\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"26\" y=\"196\" width=\"8\" height=\"19\"/><rect x=\"44\" y=\"196\" width=\"8\" height=\"19\"/></g></g><g class=\"c10-signs\"><g style=\"--i:0\" transform=\"translate(110 130) rotate(-8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:1\" transform=\"translate(300 220) rotate(8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:2\" transform=\"translate(490 310) rotate(-8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:3\" transform=\"translate(680 130) rotate(8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:4\" transform=\"translate(870 220) rotate(-8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:5\" transform=\"translate(1060 310) rotate(8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:6\" transform=\"translate(1250 130) rotate(-8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g><g style=\"--i:7\" transform=\"translate(1440 220) rotate(8)\"><rect width=\"95\" height=\"145\" rx=\"12\"/><path d=\"M20 80V35l20 20h18l18-20v45q-28 35-56 0Z\"/><path d=\"M29 76l10 4m18 0 10-4M35 101h25\"/></g></g><g class=\"c10-cat\"><path d=\"M610 470Q595 390 615 300L705 350Q800 325 895 350L980 290Q1020 430 970 495Q880 595 710 570Q570 540 595 685Q645 790 970 745\"/><path class=\"c10-eyes\" d=\"M678 420q55-45 105 15-60 22-105-15m140 15q58-60 115-20-40 40-115 20\"/><path d=\"M770 485l30 17 30-17M800 502v20m-130-46-150-30m150 50-160 10m420-35 150-30m-150 52 165 8\"/></g><g class=\"c10-roof\"><path d=\"M-100 875L800 680 1700 875M0 900L800 720 1600 900\"/><path class=\"\" d=\"M800 700L-100 900\"/><path class=\"\" d=\"M800 700L0 900\"/><path class=\"\" d=\"M800 700L100 900\"/><path class=\"\" d=\"M800 700L200 900\"/><path class=\"\" d=\"M800 700L300 900\"/><path class=\"\" d=\"M800 700L400 900\"/><path class=\"\" d=\"M800 700L500 900\"/><path class=\"\" d=\"M800 700L600 900\"/><path class=\"\" d=\"M800 700L700 900\"/><path class=\"\" d=\"M800 700L800 900\"/><path class=\"\" d=\"M800 700L900 900\"/><path class=\"\" d=\"M800 700L1000 900\"/><path class=\"\" d=\"M800 700L1100 900\"/><path class=\"\" d=\"M800 700L1200 900\"/><path class=\"\" d=\"M800 700L1300 900\"/><path class=\"\" d=\"M800 700L1400 900\"/><path class=\"\" d=\"M800 700L1500 900\"/><path class=\"\" d=\"M800 700L1600 900\"/></g><g class=\"c10-rain\"><path class=\"\" d=\"M0 0l-18 60\"/><path class=\"\" d=\"M73 137l-18 60\"/><path class=\"\" d=\"M146 274l-18 60\"/><path class=\"\" d=\"M219 411l-18 60\"/><path class=\"\" d=\"M292 548l-18 60\"/><path class=\"\" d=\"M365 685l-18 60\"/><path class=\"\" d=\"M438 822l-18 60\"/><path class=\"\" d=\"M511 109l-18 60\"/><path class=\"\" d=\"M584 246l-18 60\"/><path class=\"\" d=\"M657 383l-18 60\"/><path class=\"\" d=\"M730 520l-18 60\"/><path class=\"\" d=\"M803 657l-18 60\"/><path class=\"\" d=\"M876 794l-18 60\"/><path class=\"\" d=\"M949 81l-18 60\"/><path class=\"\" d=\"M1022 218l-18 60\"/><path class=\"\" d=\"M1095 355l-18 60\"/><path class=\"\" d=\"M1168 492l-18 60\"/><path class=\"\" d=\"M1241 629l-18 60\"/><path class=\"\" d=\"M1314 766l-18 60\"/><path class=\"\" d=\"M1387 53l-18 60\"/><path class=\"\" d=\"M1460 190l-18 60\"/><path class=\"\" d=\"M1533 327l-18 60\"/><path class=\"\" d=\"M1606 464l-18 60\"/><path class=\"\" d=\"M29 601l-18 60\"/><path class=\"\" d=\"M102 738l-18 60\"/><path class=\"\" d=\"M175 25l-18 60\"/><path class=\"\" d=\"M248 162l-18 60\"/><path class=\"\" d=\"M321 299l-18 60\"/><path class=\"\" d=\"M394 436l-18 60\"/><path class=\"\" d=\"M467 573l-18 60\"/><path class=\"\" d=\"M540 710l-18 60\"/><path class=\"\" d=\"M613 847l-18 60\"/><path class=\"\" d=\"M686 134l-18 60\"/><path class=\"\" d=\"M759 271l-18 60\"/><path class=\"\" d=\"M832 408l-18 60\"/><path class=\"\" d=\"M905 545l-18 60\"/><path class=\"\" d=\"M978 682l-18 60\"/><path class=\"\" d=\"M1051 819l-18 60\"/><path class=\"\" d=\"M1124 106l-18 60\"/><path class=\"\" d=\"M1197 243l-18 60\"/><path class=\"\" d=\"M1270 380l-18 60\"/><path class=\"\" d=\"M1343 517l-18 60\"/><path class=\"\" d=\"M1416 654l-18 60\"/><path class=\"\" d=\"M1489 791l-18 60\"/><path class=\"\" d=\"M1562 78l-18 60\"/><path class=\"\" d=\"M1635 215l-18 60\"/><path class=\"\" d=\"M58 352l-18 60\"/><path class=\"\" d=\"M131 489l-18 60\"/><path class=\"\" d=\"M204 626l-18 60\"/><path class=\"\" d=\"M277 763l-18 60\"/><path class=\"\" d=\"M350 50l-18 60\"/><path class=\"\" d=\"M423 187l-18 60\"/><path class=\"\" d=\"M496 324l-18 60\"/><path class=\"\" d=\"M569 461l-18 60\"/><path class=\"\" d=\"M642 598l-18 60\"/><path class=\"\" d=\"M715 735l-18 60\"/><path class=\"\" d=\"M788 22l-18 60\"/><path class=\"\" d=\"M861 159l-18 60\"/><path class=\"\" d=\"M934 296l-18 60\"/><path class=\"\" d=\"M1007 433l-18 60\"/><path class=\"\" d=\"M1080 570l-18 60\"/><path class=\"\" d=\"M1153 707l-18 60\"/><path class=\"\" d=\"M1226 844l-18 60\"/><path class=\"\" d=\"M1299 131l-18 60\"/><path class=\"\" d=\"M1372 268l-18 60\"/></g></svg>","moon":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g class=\"m10-orrery\" fill=\"none\"><ellipse cx=\"800\" cy=\"350\" rx=\"180\" ry=\"90\" transform=\"rotate(0 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"237\" ry=\"132\" transform=\"rotate(26 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"294\" ry=\"174\" transform=\"rotate(52 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"351\" ry=\"216\" transform=\"rotate(78 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"408\" ry=\"258\" transform=\"rotate(104 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"465\" ry=\"300\" transform=\"rotate(130 800 350)\"/><ellipse cx=\"800\" cy=\"350\" rx=\"522\" ry=\"342\" transform=\"rotate(156 800 350)\"/><path transform=\"rotate(0 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(6 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(12 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(18 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(24 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(30 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(36 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(42 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(48 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(54 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(60 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(66 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(72 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(78 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(84 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(90 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(96 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(102 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(108 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(114 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(120 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(126 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(132 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(138 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(144 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(150 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(156 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(162 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(168 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(174 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(180 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(186 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(192 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(198 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(204 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(210 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(216 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(222 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(228 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(234 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(240 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(246 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(252 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(258 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(264 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(270 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(276 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(282 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(288 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(294 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(300 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(306 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(312 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(318 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(324 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(330 800 350)\" d=\"M800 22v28\"/><path transform=\"rotate(336 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(342 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(348 800 350)\" d=\"M800 22v12\"/><path transform=\"rotate(354 800 350)\" d=\"M800 22v12\"/></g><g class=\"m10-crescent\"><path d=\"M915 120A255 255 0 1 0 930 560A220 220 0 0 1 915 120Z\"/></g><g class=\"m10-palace\"><g transform=\"translate(420 440)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(530 367.5)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(640 314.4263164512564)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(750 295)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(860 314.4263164512564)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(970 367.5)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g><g transform=\"translate(1080 440)\"><path d=\"M-35 10Q55-15 70-55Q90-10 155 10L115 22H0Z\"/><path d=\"M5 22V170H110V22M25 45V160M55 35V160M85 45V160\"/><path d=\"M-5 170H120v20H-5Z\"/></g></g><g class=\"m10-bridge\" fill=\"none\"><path d=\"M-80 740Q800 340 1680 740M-80 770Q800 370 1680 770\"/><path class=\"\" d=\"M-20 742v40\"/><path class=\"\" d=\"M22 726.3090191002384v40\"/><path class=\"\" d=\"M64 710.7198002327367v40\"/><path class=\"\" d=\"M106 695.3334454639262v40\"/><path class=\"\" d=\"M148 680.2497412087129v40\"/><path class=\"\" d=\"M190 665.5665110772853v40\"/><path class=\"\" d=\"M232 651.3789814514652v40\"/><path class=\"\" d=\"M274 637.7791639050788v40\"/><path class=\"\" d=\"M316 624.8552584735942v40\"/><path class=\"\" d=\"M358 612.691081643045v40\"/><path class=\"\" d=\"M400 601.3655227679562v40\"/><path class=\"\" d=\"M442 590.9520324436073v40\"/><path class=\"\" d=\"M484 581.518146150737v40\"/><path class=\"\" d=\"M526 573.1250462620345v40\"/><path class=\"\" d=\"M568 565.8271652509754v40\"/><path class=\"\" d=\"M610 559.6718326763441v40\"/><path class=\"\" d=\"M652 554.6989682318824v40\"/><path class=\"\" d=\"M694 550.9408228517578v40\"/><path class=\"\" d=\"M736 548.4217695508795v40\"/><path class=\"\" d=\"M778 547.158145356544v40\"/><path class=\"\" d=\"M820 547.1581453565439v40\"/><path class=\"\" d=\"M862 548.4217695508795v40\"/><path class=\"\" d=\"M904 550.9408228517578v40\"/><path class=\"\" d=\"M946 554.6989682318824v40\"/><path class=\"\" d=\"M988 559.6718326763441v40\"/><path class=\"\" d=\"M1030 565.8271652509754v40\"/><path class=\"\" d=\"M1072 573.1250462620344v40\"/><path class=\"\" d=\"M1114 581.518146150737v40\"/><path class=\"\" d=\"M1156 590.9520324436073v40\"/><path class=\"\" d=\"M1198 601.3655227679561v40\"/><path class=\"\" d=\"M1240 612.691081643045v40\"/><path class=\"\" d=\"M1282 624.8552584735941v40\"/><path class=\"\" d=\"M1324 637.7791639050788v40\"/><path class=\"\" d=\"M1366 651.378981451465v40\"/><path class=\"\" d=\"M1408 665.5665110772853v40\"/><path class=\"\" d=\"M1450 680.2497412087129v40\"/><path class=\"\" d=\"M1492 695.3334454639263v40\"/><path class=\"\" d=\"M1534 710.7198002327367v40\"/><path class=\"\" d=\"M1576 726.3090191002384v40\"/><path class=\"\" d=\"M1618 742v40\"/></g><g class=\"m10-water\" fill=\"none\"><ellipse cx=\"800\" cy=\"700\" rx=\"160\" ry=\"12\"/><ellipse cx=\"800\" cy=\"708\" rx=\"194\" ry=\"15\"/><ellipse cx=\"800\" cy=\"716\" rx=\"228\" ry=\"18\"/><ellipse cx=\"800\" cy=\"724\" rx=\"262\" ry=\"21\"/><ellipse cx=\"800\" cy=\"732\" rx=\"296\" ry=\"24\"/><ellipse cx=\"800\" cy=\"740\" rx=\"330\" ry=\"27\"/><ellipse cx=\"800\" cy=\"748\" rx=\"364\" ry=\"30\"/><ellipse cx=\"800\" cy=\"756\" rx=\"398\" ry=\"33\"/><ellipse cx=\"800\" cy=\"764\" rx=\"432\" ry=\"36\"/><ellipse cx=\"800\" cy=\"772\" rx=\"466\" ry=\"39\"/><ellipse cx=\"800\" cy=\"780\" rx=\"500\" ry=\"42\"/><ellipse cx=\"800\" cy=\"788\" rx=\"534\" ry=\"45\"/><ellipse cx=\"800\" cy=\"796\" rx=\"568\" ry=\"48\"/><ellipse cx=\"800\" cy=\"804\" rx=\"602\" ry=\"51\"/><ellipse cx=\"800\" cy=\"812\" rx=\"636\" ry=\"54\"/><ellipse cx=\"800\" cy=\"820\" rx=\"670\" ry=\"57\"/><ellipse cx=\"800\" cy=\"828\" rx=\"704\" ry=\"60\"/><ellipse cx=\"800\" cy=\"836\" rx=\"738\" ry=\"63\"/><ellipse cx=\"800\" cy=\"844\" rx=\"772\" ry=\"66\"/><ellipse cx=\"800\" cy=\"852\" rx=\"806\" ry=\"69\"/><ellipse cx=\"800\" cy=\"860\" rx=\"840\" ry=\"72\"/><ellipse cx=\"800\" cy=\"868\" rx=\"874\" ry=\"75\"/><ellipse cx=\"800\" cy=\"876\" rx=\"908\" ry=\"78\"/><ellipse cx=\"800\" cy=\"884\" rx=\"942\" ry=\"81\"/></g><g class=\"m10-jade\"><path style=\"--i:0\" transform=\"translate(0 0)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:1\" transform=\"translate(239 109)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:2\" transform=\"translate(478 218)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:3\" transform=\"translate(717 327)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:4\" transform=\"translate(956 436)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:5\" transform=\"translate(1195 545)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:6\" transform=\"translate(1434 54)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:7\" transform=\"translate(93 163)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:8\" transform=\"translate(332 272)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:9\" transform=\"translate(571 381)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:10\" transform=\"translate(810 490)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:11\" transform=\"translate(1049 599)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:12\" transform=\"translate(1288 108)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:13\" transform=\"translate(1527 217)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:14\" transform=\"translate(186 326)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:15\" transform=\"translate(425 435)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:16\" transform=\"translate(664 544)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:17\" transform=\"translate(903 53)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:18\" transform=\"translate(1142 162)\" d=\"M0-12L6 0 0 35-6 0Z\"/><path style=\"--i:19\" transform=\"translate(1381 271)\" d=\"M0-12L6 0 0 35-6 0Z\"/></g></svg>","cuoi":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g class=\"u10-roots\" fill=\"none\"><path class=\"\" d=\"M800 460Q650 610 150 760T-50 910\"/><path class=\"\" d=\"M800 460Q670 610 230 760T55 910\"/><path class=\"\" d=\"M800 460Q690 610 310 760T160 910\"/><path class=\"\" d=\"M800 460Q710 610 390 760T265 910\"/><path class=\"\" d=\"M800 460Q730 610 470 760T370 910\"/><path class=\"\" d=\"M800 460Q750 610 550 760T475 910\"/><path class=\"\" d=\"M800 460Q770 610 630 760T580 910\"/><path class=\"\" d=\"M800 460Q790 610 710 760T685 910\"/><path class=\"\" d=\"M800 460Q810 610 790 760T790 910\"/><path class=\"\" d=\"M800 460Q830 610 870 760T895 910\"/><path class=\"\" d=\"M800 460Q850 610 950 760T1000 910\"/><path class=\"\" d=\"M800 460Q870 610 1030 760T1105 910\"/><path class=\"\" d=\"M800 460Q890 610 1110 760T1210 910\"/><path class=\"\" d=\"M800 460Q910 610 1190 760T1315 910\"/><path class=\"\" d=\"M800 460Q930 610 1270 760T1420 910\"/><path class=\"\" d=\"M800 460Q950 610 1350 760T1525 910\"/><path class=\"\" d=\"M800 460Q970 610 1430 760T1630 910\"/></g><g class=\"u10-islands\"><path transform=\"translate(-50 680)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(200 620)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(450 560)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(700 680)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(950 620)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(1200 560)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/><path transform=\"translate(1450 680)\" d=\"M-100 0Q0-40 100 0L35 90 0 45-35 70Z\"/></g><g class=\"u10-tree\"><path d=\"M700 740Q810 520 680 350Q630 310 450 230Q665 255 760 370Q795 280 690 170Q790 200 825 350Q880 230 1090 150Q880 300 890 430Q905 580 960 740Z\"/><path style=\"--i:0\" transform=\"translate(410 100) rotate(0)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:1\" transform=\"translate(567 171) rotate(37)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:2\" transform=\"translate(724 242) rotate(74)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:3\" transform=\"translate(881 313) rotate(111)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:4\" transform=\"translate(1038 124) rotate(148)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:5\" transform=\"translate(415 195) rotate(185)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:6\" transform=\"translate(572 266) rotate(222)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:7\" transform=\"translate(729 337) rotate(259)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:8\" transform=\"translate(886 148) rotate(296)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:9\" transform=\"translate(1043 219) rotate(333)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:10\" transform=\"translate(420 290) rotate(370)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:11\" transform=\"translate(577 101) rotate(407)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:12\" transform=\"translate(734 172) rotate(444)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:13\" transform=\"translate(891 243) rotate(481)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:14\" transform=\"translate(1048 314) rotate(518)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:15\" transform=\"translate(425 125) rotate(555)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:16\" transform=\"translate(582 196) rotate(592)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:17\" transform=\"translate(739 267) rotate(629)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:18\" transform=\"translate(896 338) rotate(666)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:19\" transform=\"translate(1053 149) rotate(703)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:20\" transform=\"translate(430 220) rotate(740)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:21\" transform=\"translate(587 291) rotate(777)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:22\" transform=\"translate(744 102) rotate(814)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:23\" transform=\"translate(901 173) rotate(851)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:24\" transform=\"translate(1058 244) rotate(888)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:25\" transform=\"translate(435 315) rotate(925)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:26\" transform=\"translate(592 126) rotate(962)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:27\" transform=\"translate(749 197) rotate(999)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:28\" transform=\"translate(906 268) rotate(1036)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:29\" transform=\"translate(1063 339) rotate(1073)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/><path style=\"--i:30\" transform=\"translate(440 150) rotate(1110)\" d=\"M-95 0Q0-85 95 0Q0 85-95 0Z\"/></g><g class=\"u10-lanterns\"><g style=\"--i:0\" transform=\"translate(90 170)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:1\" transform=\"translate(175 260)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:2\" transform=\"translate(260 350)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:3\" transform=\"translate(345 440)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:4\" transform=\"translate(430 530)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:5\" transform=\"translate(515 170)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:6\" transform=\"translate(600 260)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:7\" transform=\"translate(685 350)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:8\" transform=\"translate(770 440)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:9\" transform=\"translate(855 530)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:10\" transform=\"translate(940 170)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:11\" transform=\"translate(1025 260)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:12\" transform=\"translate(1110 350)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:13\" transform=\"translate(1195 440)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:14\" transform=\"translate(1280 530)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:15\" transform=\"translate(1365 170)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:16\" transform=\"translate(1450 260)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g><g style=\"--i:17\" transform=\"translate(1535 350)\"><path d=\"M0-140V-20\"/><path d=\"M-19-20H19L30 0 19 30H-19L-30 0Z\"/><path d=\"M-8-18V28M8-18V28M0 30V64\"/></g></g><g class=\"u10-path\" fill=\"none\"><path class=\"\" d=\"M350 825q50-30 100 0\"/><path class=\"\" d=\"M383 819q50-30 100 0\"/><path class=\"\" d=\"M416 813q50-30 100 0\"/><path class=\"\" d=\"M449 807q50-30 100 0\"/><path class=\"\" d=\"M482 801q50-30 100 0\"/><path class=\"\" d=\"M515 795q50-30 100 0\"/><path class=\"\" d=\"M548 789q50-30 100 0\"/><path class=\"\" d=\"M581 783q50-30 100 0\"/><path class=\"\" d=\"M614 777q50-30 100 0\"/><path class=\"\" d=\"M647 771q50-30 100 0\"/><path class=\"\" d=\"M680 765q50-30 100 0\"/><path class=\"\" d=\"M713 759q50-30 100 0\"/><path class=\"\" d=\"M746 753q50-30 100 0\"/><path class=\"\" d=\"M779 747q50-30 100 0\"/><path class=\"\" d=\"M812 741q50-30 100 0\"/></g><g class=\"u10-seeds\"><path style=\"--i:0\" transform=\"translate(0 0) rotate(0)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:1\" transform=\"translate(197 137) rotate(31)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:2\" transform=\"translate(394 274) rotate(62)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:3\" transform=\"translate(591 411) rotate(93)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:4\" transform=\"translate(788 548) rotate(124)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:5\" transform=\"translate(985 685) rotate(155)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:6\" transform=\"translate(1182 822) rotate(186)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:7\" transform=\"translate(1379 109) rotate(217)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:8\" transform=\"translate(1576 246) rotate(248)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:9\" transform=\"translate(173 383) rotate(279)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:10\" transform=\"translate(370 520) rotate(310)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:11\" transform=\"translate(567 657) rotate(341)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:12\" transform=\"translate(764 794) rotate(372)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:13\" transform=\"translate(961 81) rotate(403)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:14\" transform=\"translate(1158 218) rotate(434)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:15\" transform=\"translate(1355 355) rotate(465)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:16\" transform=\"translate(1552 492) rotate(496)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:17\" transform=\"translate(149 629) rotate(527)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:18\" transform=\"translate(346 766) rotate(558)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:19\" transform=\"translate(543 53) rotate(589)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:20\" transform=\"translate(740 190) rotate(620)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:21\" transform=\"translate(937 327) rotate(651)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:22\" transform=\"translate(1134 464) rotate(682)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:23\" transform=\"translate(1331 601) rotate(713)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:24\" transform=\"translate(1528 738) rotate(744)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:25\" transform=\"translate(125 25) rotate(775)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:26\" transform=\"translate(322 162) rotate(806)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:27\" transform=\"translate(519 299) rotate(837)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:28\" transform=\"translate(716 436) rotate(868)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:29\" transform=\"translate(913 573) rotate(899)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:30\" transform=\"translate(1110 710) rotate(930)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:31\" transform=\"translate(1307 847) rotate(961)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:32\" transform=\"translate(1504 134) rotate(992)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:33\" transform=\"translate(101 271) rotate(1023)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:34\" transform=\"translate(298 408) rotate(1054)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:35\" transform=\"translate(495 545) rotate(1085)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:36\" transform=\"translate(692 682) rotate(1116)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:37\" transform=\"translate(889 819) rotate(1147)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:38\" transform=\"translate(1086 106) rotate(1178)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:39\" transform=\"translate(1283 243) rotate(1209)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:40\" transform=\"translate(1480 380) rotate(1240)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:41\" transform=\"translate(77 517) rotate(1271)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:42\" transform=\"translate(274 654) rotate(1302)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:43\" transform=\"translate(471 791) rotate(1333)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/><path style=\"--i:44\" transform=\"translate(668 78) rotate(1364)\" d=\"M0 0Q-22-32 12-25Q20-12 0 0L8 15\"/></g></svg>","cheng":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\" aria-hidden=\"true\"><g class=\"x10-contact\"><g style=\"--i:0\" transform=\"translate(-80 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 01</text></g><g style=\"--i:1\" transform=\"translate(180 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 02</text></g><g style=\"--i:2\" transform=\"translate(440 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 03</text></g><g style=\"--i:3\" transform=\"translate(700 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 04</text></g><g style=\"--i:4\" transform=\"translate(960 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 05</text></g><g style=\"--i:5\" transform=\"translate(1220 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 06</text></g><g style=\"--i:6\" transform=\"translate(1480 80) rotate(-8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 07</text></g><g style=\"--i:7\" transform=\"translate(-80 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 08</text></g><g style=\"--i:8\" transform=\"translate(180 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 09</text></g><g style=\"--i:9\" transform=\"translate(440 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 10</text></g><g style=\"--i:10\" transform=\"translate(700 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 11</text></g><g style=\"--i:11\" transform=\"translate(960 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 12</text></g><g style=\"--i:12\" transform=\"translate(1220 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 13</text></g><g style=\"--i:13\" transform=\"translate(1480 610) rotate(8)\"><rect width=\"220\" height=\"155\"/><path d=\"M15 120L70 45 130 90 190 20v110H15Z\"/><rect x=\"4\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"4\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"29\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"54\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"79\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"104\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"129\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"154\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"179\" y=\"162\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"-14\" width=\"13\" height=\"8\"/><rect x=\"204\" y=\"162\" width=\"13\" height=\"8\"/><text x=\"12\" y=\"148\">FRAME 14</text></g></g><g class=\"x10-perspective\" fill=\"none\"><rect x=\"80\" y=\"40\" width=\"1440\" height=\"820\"/><rect x=\"150\" y=\"76\" width=\"1300\" height=\"748\"/><rect x=\"220\" y=\"112\" width=\"1160\" height=\"676\"/><rect x=\"290\" y=\"148\" width=\"1020\" height=\"604\"/><rect x=\"360\" y=\"184\" width=\"880\" height=\"532\"/><rect x=\"430\" y=\"220\" width=\"740\" height=\"460\"/><rect x=\"500\" y=\"256\" width=\"600\" height=\"388\"/><rect x=\"570\" y=\"292\" width=\"460\" height=\"316\"/><rect x=\"640\" y=\"328\" width=\"320\" height=\"244\"/><path class=\"\" d=\"M800 450L0 0\"/><path class=\"\" d=\"M800 450L0 300\"/><path class=\"\" d=\"M800 450L0 600\"/><path class=\"\" d=\"M800 450L0 900\"/><path class=\"\" d=\"M800 450L1600 0\"/><path class=\"\" d=\"M800 450L1600 300\"/><path class=\"\" d=\"M800 450L1600 600\"/><path class=\"\" d=\"M800 450L1600 900\"/></g><g class=\"x10-shutter\"><path transform=\"rotate(0 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(45 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(90 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(135 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(180 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(225 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(270 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><path transform=\"rotate(315 800 450)\" d=\"M800 185L1040 350 845 430 690 260Z\"/><circle cx=\"800\" cy=\"450\" r=\"115\"/><path d=\"M670 450h260M800 320v260\"/></g><g class=\"x10-fractures\" fill=\"none\"><path class=\"\" d=\"M800 450L0 900l-80 -90\"/><path class=\"\" d=\"M800 450L137 0l80 90\"/><path class=\"\" d=\"M800 450L274 900l-80 -90\"/><path class=\"\" d=\"M800 450L411 0l80 90\"/><path class=\"\" d=\"M800 450L548 900l-80 -90\"/><path class=\"\" d=\"M800 450L685 0l80 90\"/><path class=\"\" d=\"M800 450L822 900l-80 -90\"/><path class=\"\" d=\"M800 450L959 0l80 90\"/><path class=\"\" d=\"M800 450L1096 900l-80 -90\"/><path class=\"\" d=\"M800 450L1233 0l80 90\"/><path class=\"\" d=\"M800 450L1370 900l-80 -90\"/><path class=\"\" d=\"M800 450L1507 0l80 90\"/></g><g class=\"x10-time\"><path d=\"M0 520H1600M0 530H1600\"/><path class=\"\" d=\"M0 520v28\"/><path class=\"\" d=\"M20 520v12\"/><path class=\"\" d=\"M40 520v12\"/><path class=\"\" d=\"M60 520v12\"/><path class=\"\" d=\"M80 520v12\"/><path class=\"\" d=\"M100 520v28\"/><path class=\"\" d=\"M120 520v12\"/><path class=\"\" d=\"M140 520v12\"/><path class=\"\" d=\"M160 520v12\"/><path class=\"\" d=\"M180 520v12\"/><path class=\"\" d=\"M200 520v28\"/><path class=\"\" d=\"M220 520v12\"/><path class=\"\" d=\"M240 520v12\"/><path class=\"\" d=\"M260 520v12\"/><path class=\"\" d=\"M280 520v12\"/><path class=\"\" d=\"M300 520v28\"/><path class=\"\" d=\"M320 520v12\"/><path class=\"\" d=\"M340 520v12\"/><path class=\"\" d=\"M360 520v12\"/><path class=\"\" d=\"M380 520v12\"/><path class=\"\" d=\"M400 520v28\"/><path class=\"\" d=\"M420 520v12\"/><path class=\"\" d=\"M440 520v12\"/><path class=\"\" d=\"M460 520v12\"/><path class=\"\" d=\"M480 520v12\"/><path class=\"\" d=\"M500 520v28\"/><path class=\"\" d=\"M520 520v12\"/><path class=\"\" d=\"M540 520v12\"/><path class=\"\" d=\"M560 520v12\"/><path class=\"\" d=\"M580 520v12\"/><path class=\"\" d=\"M600 520v28\"/><path class=\"\" d=\"M620 520v12\"/><path class=\"\" d=\"M640 520v12\"/><path class=\"\" d=\"M660 520v12\"/><path class=\"\" d=\"M680 520v12\"/><path class=\"\" d=\"M700 520v28\"/><path class=\"\" d=\"M720 520v12\"/><path class=\"\" d=\"M740 520v12\"/><path class=\"\" d=\"M760 520v12\"/><path class=\"\" d=\"M780 520v12\"/><path class=\"\" d=\"M800 520v28\"/><path class=\"\" d=\"M820 520v12\"/><path class=\"\" d=\"M840 520v12\"/><path class=\"\" d=\"M860 520v12\"/><path class=\"\" d=\"M880 520v12\"/><path class=\"\" d=\"M900 520v28\"/><path class=\"\" d=\"M920 520v12\"/><path class=\"\" d=\"M940 520v12\"/><path class=\"\" d=\"M960 520v12\"/><path class=\"\" d=\"M980 520v12\"/><path class=\"\" d=\"M1000 520v28\"/><path class=\"\" d=\"M1020 520v12\"/><path class=\"\" d=\"M1040 520v12\"/><path class=\"\" d=\"M1060 520v12\"/><path class=\"\" d=\"M1080 520v12\"/><path class=\"\" d=\"M1100 520v28\"/><path class=\"\" d=\"M1120 520v12\"/><path class=\"\" d=\"M1140 520v12\"/><path class=\"\" d=\"M1160 520v12\"/><path class=\"\" d=\"M1180 520v12\"/><path class=\"\" d=\"M1200 520v28\"/><path class=\"\" d=\"M1220 520v12\"/><path class=\"\" d=\"M1240 520v12\"/><path class=\"\" d=\"M1260 520v12\"/><path class=\"\" d=\"M1280 520v12\"/><path class=\"\" d=\"M1300 520v28\"/><path class=\"\" d=\"M1320 520v12\"/><path class=\"\" d=\"M1340 520v12\"/><path class=\"\" d=\"M1360 520v12\"/><path class=\"\" d=\"M1380 520v12\"/><path class=\"\" d=\"M1400 520v28\"/><path class=\"\" d=\"M1420 520v12\"/><path class=\"\" d=\"M1440 520v12\"/><path class=\"\" d=\"M1460 520v12\"/><path class=\"\" d=\"M1480 520v12\"/><path class=\"\" d=\"M1500 520v28\"/><path class=\"\" d=\"M1520 520v12\"/><path class=\"\" d=\"M1540 520v12\"/><path class=\"\" d=\"M1560 520v12\"/><path class=\"\" d=\"M1580 520v12\"/><text x=\"100\" y=\"505\">00:00:01 • REWIND</text><text x=\"1160\" y=\"505\">EXPOSURE / MEMORY</text></g></svg>"};
    const LUX_GLYPHS10 = {"rose":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 28H24V5h8v42h8V16h8v26h8V8h8v40h8V23h28\"/><path d=\"M0 54H100\"/></svg>","cat":"<svg viewBox=\"0 0 104 64\"><path d=\"M6 45V10l19 14h28L72 5v40q-34 28-66 0m67-5q40-20 20-35\"/><path d=\"M20 38h10m17 0h10\"/></svg>","moon":"<svg viewBox=\"0 0 104 64\"><path d=\"M58 4a26 26 0 1 0 0 50A22 22 0 0 1 58 4Z\"/><ellipse cx=\"48\" cy=\"34\" rx=\"45\" ry=\"15\"/></svg>","cuoi":"<svg viewBox=\"0 0 104 64\"><path d=\"M5 55Q30 8 90 10M32 32Q5 5 37 9l-5 23m18-11Q48-4 68 4L50 21m-6 10Q78 23 72 44L44 31\"/></svg>","cheng":"<svg viewBox=\"0 0 104 64\"><path d=\"M4 4H96V56H4ZM10 10H90V45H10M36 4v52m28-52v52\"/><path d=\"M18 48h10m16 0h10m16 0h10\"/></svg>","klein":"<svg viewBox=\"0 0 104 64\"><path d=\"M4 10H30V50H4ZM38 4H64V44H38ZM72 12H98V52H72Z\"/><path d=\"M10 30l7-9 7 9-7 9Zm34-5 7-10 7 10-7 9Zm34 7 7-9 7 9-7 9Z\"/></svg>","aether":"<svg viewBox=\"0 0 104 64\"><path d=\"M4 48L32 5 49 47 69 8 96 48ZM32 5V48M69 8V48M4 48h92\"/></svg>","cam":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 50Q22-40 45 38Q65-15 98 10M0 56Q25 5 49 42Q70 7 100 20M3 60Q50 29 99 34\"/></svg>","nyx":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 36L20 5 44 42 71 3 100 35M20 5L71 3 44 42 0 36 100 35 71 3\"/><circle cx=\"20\" cy=\"5\" r=\"4\"/><circle cx=\"71\" cy=\"3\" r=\"3\"/></svg>","starry":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 46Q44-18 69 20T26 46Q12 20 50 16T98 3M0 56Q45 4 72 29T100 12\"/></svg>","autumn":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 58L90 4M28 40L8 23 30 25 27 5 45 19 57 0 60 22 88 15 76 36 99 47 65 49 63 60 46 48Z\"/></svg>","hacmong":"<svg viewBox=\"0 0 104 64\"><path d=\"M0 42Q25 9 50 30Q70 4 100 16Q73 13 57 35L91 48 53 41 33 58 41 39Q20 18 0 42Z\"/></svg>"};
    const LUX_CONFIG10 = {"rose":{"id":"rose","runtime":"TamonBSide","root":"tamon-bside-equipped","world":"tamon-bside-world","ui":"tamon-bside-ui-frame","realm":"tamon-bside-pet-realm","pet":"tamon-bside-pet","stage":"pet-tamon-bside-stage","ult":"createUltimate","css":"tamon-b-side","kicker":"TAMON / ENCORE","title":"Bóng Hồng · Đại Sân Khấu","subtitle":"Đèn sân khấu mở · Vạn nhịp cùng ngân","color":"#ff70b5","bg":"#281121","font":"Arial, sans-serif","radius":"24px 4px 24px 4px"},"cat":{"id":"cat","runtime":"TamonPinkStatic","root":"tamon-pinkstatic-equipped","world":"tamon-pinkstatic-world","ui":"tamon-pinkstatic-ui","realm":"tamon-pinkstatic-realm","pet":"tamon-pinkstatic-pet","stage":"pet-tamon-pinkstatic-stage","ult":"triggerUltimate","css":"tamon-b-side","kicker":"TAMON / AFTER HOURS","title":"Hắc Miêu · Thành Phố Không Ngủ","subtitle":"Bước qua mái phố · Đánh thức ánh đèn","color":"#89ffce","bg":"#101d28","font":"Consolas, monospace","radius":"3px 22px 3px 22px"},"moon":{"id":"moon","runtime":"MidAutumn","root":"midautumn-moon-palace-equipped","world":"midautumn-world","ui":"midautumn-ui-frame","realm":"midautumn-pet-realm","pet":"midautumn-moon-palace-pet","stage":"pet-midautumn-moon-palace-stage","ult":"createUltimate","css":"trung-thu-nguyet-cung","kicker":"NGUYỆT CUNG / KÍNH HỒ","title":"Thiên Nguyệt · Thủy Kính Cung","subtitle":"Bảy quỹ đạo giao hòa · Ngân kiều soi bóng","color":"#b8d8ff","bg":"#17233e","font":"Georgia, serif","radius":"40px 40px 10px 10px"},"cuoi":{"id":"cuoi","runtime":"MidAutumn","root":"midautumn-cuoi-equipped","world":"midautumn-world","ui":"midautumn-ui-frame","realm":"midautumn-pet-realm","pet":"midautumn-cuoi-pet","stage":"pet-midautumn-cuoi-stage","ult":"createUltimate","css":"trung-thu-nguyet-cung","kicker":"CHÚ CUỘI / CỔ TÍCH","title":"Nguyệt Quế · Thiên Đăng Cổ Thụ","subtitle":"Rễ nối trời xa · Ngàn đèn dẫn lối","color":"#e4c579","bg":"#23351e","font":"Palatino Linotype, Georgia, serif","radius":"5px 36px 8px 28px"},"cheng":{"id":"cheng","runtime":"LinkClickCheng","root":"linkclick-cheng-equipped","world":"lcx-world","ui":"lcx-ui-frame","realm":"lcx-pet-realm","pet":"lcx-cheng-pet","stage":"pet-linkclick-cheng-stage","ult":"createUltimate","css":"link-click-cheng-xiaoshi","kicker":"CHENG XIAOSHI / EXPOSURE","title":"Thời Quang · Vạn Ảnh Nghịch Lưu","subtitle":"Một khung hình · Muôn ngả ký ức","color":"#ffcc79","bg":"#142632","font":"Consolas, monospace","radius":"2px"}};
    // Pointer gestures own their listeners and decorations; scrolling never fires a tap.

    Object.assign(LUX_ART10,{"summer":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\"><defs><linearGradient id=\"s14sea\"><stop stop-color=\"#29bfc1\"/><stop offset=\"1\" stop-color=\"#062e58\"/></linearGradient></defs><g class=\"s14-sky\"><path d=\"M-100 60Q400 -100800 80T1700 80\"/><path d=\"M-100 77Q400 -81800 96T1700 98\"/><path d=\"M-100 94Q400 -62800 112T1700 116\"/><path d=\"M-100 111Q400 -43800 128T1700 134\"/><path d=\"M-100 128Q400 -24800 144T1700 152\"/><path d=\"M-100 145Q400 -5800 160T1700 170\"/><path d=\"M-100 162Q400 14800 176T1700 188\"/><path d=\"M-100 179Q400 33800 192T1700 206\"/><path d=\"M-100 196Q400 52800 208T1700 224\"/><path d=\"M-100 213Q400 71800 224T1700 242\"/><path d=\"M-100 230Q400 90800 240T1700 260\"/><path d=\"M-100 247Q400 109800 256T1700 278\"/><path d=\"M-100 264Q400 128800 272T1700 296\"/><path d=\"M-100 281Q400 147800 288T1700 314\"/><path d=\"M-100 298Q400 166800 304T1700 332\"/><path d=\"M-100 315Q400 185800 320T1700 350\"/><path d=\"M-100 332Q400 204800 336T1700 368\"/><path d=\"M-100 349Q400 223800 352T1700 386\"/></g><g class=\"s14-sun\"><circle cx=\"800\" cy=\"300\" r=\"115\"/><path transform=\"rotate(0 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(10 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(20 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(30 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(40 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(50 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(60 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(70 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(80 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(90 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(100 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(110 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(120 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(130 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(140 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(150 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(160 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(170 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(180 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(190 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(200 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(210 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(220 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(230 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(240 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(250 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(260 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(270 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(280 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(290 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(300 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(310 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(320 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(330 800 300)\" d=\"M793 150L800 70807 150Z\"/><path transform=\"rotate(340 800 300)\" d=\"M793 150L800 30807 150Z\"/><path transform=\"rotate(350 800 300)\" d=\"M793 150L800 70807 150Z\"/></g><g class=\"s14-terraces\"><path d=\"M300 560Q800 350 1300 560L1300 580Q800 385 300 580Z\"/><path d=\"M235 592Q800 382 1365 592L1365 612Q800 417 235 612Z\"/><path d=\"M170 624Q800 414 1430 624L1430 644Q800 449 170 644Z\"/><path d=\"M105 656Q800 446 1495 656L1495 676Q800 481 105 676Z\"/><path d=\"M40 688Q800 478 1560 688L1560 708Q800 513 40 708Z\"/><path d=\"M-25 720Q800 510 1625 720L1625 740Q800 545 -25 740Z\"/><path d=\"M-90 752Q800 542 1690 752L1690 772Q800 577 -90 772Z\"/><path d=\"M-155 784Q800 574 1755 784L1755 804Q800 609 -155 804Z\"/></g><g class=\"s14-sails\"><g transform=\"translate(160 546)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(365 509)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(570 472)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(775 435)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(980 472)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(1185 509)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g><g transform=\"translate(1390 546)\"><path d=\"M0 0V-180Q95-85 80-20Z\"/><path d=\"M-8-160Q-70-90-90-10L-8-20Z\"/><path d=\"M-95 0H95L65 22H-60Z\"/></g></g><g class=\"s14-waves\"><path d=\"M-100 665Q100 625300 665T700 665T1100 665T1700 665\"/><path d=\"M-100 677Q100 637300 677T700 677T1100 677T1700 677\"/><path d=\"M-100 689Q100 649300 689T700 689T1100 689T1700 689\"/><path d=\"M-100 701Q100 661300 701T700 701T1100 701T1700 701\"/><path d=\"M-100 713Q100 673300 713T700 713T1100 713T1700 713\"/><path d=\"M-100 725Q100 685300 725T700 725T1100 725T1700 725\"/><path d=\"M-100 737Q100 697300 737T700 737T1100 737T1700 737\"/><path d=\"M-100 749Q100 709300 749T700 749T1100 749T1700 749\"/><path d=\"M-100 761Q100 721300 761T700 761T1100 761T1700 761\"/><path d=\"M-100 773Q100 733300 773T700 773T1100 773T1700 773\"/><path d=\"M-100 785Q100 745300 785T700 785T1100 785T1700 785\"/><path d=\"M-100 797Q100 757300 797T700 797T1100 797T1700 797\"/><path d=\"M-100 809Q100 769300 809T700 809T1100 809T1700 809\"/><path d=\"M-100 821Q100 781300 821T700 821T1100 821T1700 821\"/><path d=\"M-100 833Q100 793300 833T700 833T1100 833T1700 833\"/><path d=\"M-100 845Q100 805300 845T700 845T1100 845T1700 845\"/><path d=\"M-100 857Q100 817300 857T700 857T1100 857T1700 857\"/><path d=\"M-100 869Q100 829300 869T700 869T1100 869T1700 869\"/><path d=\"M-100 881Q100 841300 881T700 881T1100 881T1700 881\"/><path d=\"M-100 893Q100 853300 893T700 893T1100 893T1700 893\"/><path d=\"M-100 905Q100 865300 905T700 905T1100 905T1700 905\"/><path d=\"M-100 917Q100 877300 917T700 917T1100 917T1700 917\"/></g><g class=\"s14-flowers\"><g transform=\"translate(-40 760)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(170 800)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(380 760)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(590 800)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(800 760)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(1010 800)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(1220 760)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(1430 800)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g><g transform=\"translate(1640 760)\"><ellipse transform=\"rotate(0)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(30)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(60)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(90)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(120)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(150)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(180)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(210)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(240)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(270)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(300)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><ellipse transform=\"rotate(330)\" cx=\"0\" cy=\"-45\" rx=\"12\" ry=\"31\"/><circle r=\"23\"/></g></g><g class=\"s14-gulls\"><path style=\"--i:0\" d=\"M0 100q18-22 35 0q18-22 35 0\"/><path style=\"--i:1\" d=\"M127 150q18-22 35 0q18-22 35 0\"/><path style=\"--i:2\" d=\"M254 200q18-22 35 0q18-22 35 0\"/><path style=\"--i:3\" d=\"M381 250q18-22 35 0q18-22 35 0\"/><path style=\"--i:4\" d=\"M508 300q18-22 35 0q18-22 35 0\"/><path style=\"--i:5\" d=\"M635 100q18-22 35 0q18-22 35 0\"/><path style=\"--i:6\" d=\"M762 150q18-22 35 0q18-22 35 0\"/><path style=\"--i:7\" d=\"M889 200q18-22 35 0q18-22 35 0\"/><path style=\"--i:8\" d=\"M1016 250q18-22 35 0q18-22 35 0\"/><path style=\"--i:9\" d=\"M1143 300q18-22 35 0q18-22 35 0\"/><path style=\"--i:10\" d=\"M1270 100q18-22 35 0q18-22 35 0\"/><path style=\"--i:11\" d=\"M1397 150q18-22 35 0q18-22 35 0\"/><path style=\"--i:12\" d=\"M24 200q18-22 35 0q18-22 35 0\"/><path style=\"--i:13\" d=\"M151 250q18-22 35 0q18-22 35 0\"/><path style=\"--i:14\" d=\"M278 300q18-22 35 0q18-22 35 0\"/><path style=\"--i:15\" d=\"M405 100q18-22 35 0q18-22 35 0\"/></g><g class=\"s14-spray\"><circle cx=\"0\" cy=\"550\" r=\"1\"/><circle cx=\"173\" cy=\"633\" r=\"2\"/><circle cx=\"346\" cy=\"716\" r=\"3\"/><circle cx=\"519\" cy=\"799\" r=\"1\"/><circle cx=\"692\" cy=\"562\" r=\"2\"/><circle cx=\"865\" cy=\"645\" r=\"3\"/><circle cx=\"1038\" cy=\"728\" r=\"1\"/><circle cx=\"1211\" cy=\"811\" r=\"2\"/><circle cx=\"1384\" cy=\"574\" r=\"3\"/><circle cx=\"1557\" cy=\"657\" r=\"1\"/><circle cx=\"130\" cy=\"740\" r=\"2\"/><circle cx=\"303\" cy=\"823\" r=\"3\"/><circle cx=\"476\" cy=\"586\" r=\"1\"/><circle cx=\"649\" cy=\"669\" r=\"2\"/><circle cx=\"822\" cy=\"752\" r=\"3\"/><circle cx=\"995\" cy=\"835\" r=\"1\"/><circle cx=\"1168\" cy=\"598\" r=\"2\"/><circle cx=\"1341\" cy=\"681\" r=\"3\"/><circle cx=\"1514\" cy=\"764\" r=\"1\"/><circle cx=\"87\" cy=\"847\" r=\"2\"/><circle cx=\"260\" cy=\"610\" r=\"3\"/><circle cx=\"433\" cy=\"693\" r=\"1\"/><circle cx=\"606\" cy=\"776\" r=\"2\"/><circle cx=\"779\" cy=\"859\" r=\"3\"/><circle cx=\"952\" cy=\"622\" r=\"1\"/><circle cx=\"1125\" cy=\"705\" r=\"2\"/><circle cx=\"1298\" cy=\"788\" r=\"3\"/><circle cx=\"1471\" cy=\"551\" r=\"1\"/><circle cx=\"44\" cy=\"634\" r=\"2\"/><circle cx=\"217\" cy=\"717\" r=\"3\"/><circle cx=\"390\" cy=\"800\" r=\"1\"/><circle cx=\"563\" cy=\"563\" r=\"2\"/><circle cx=\"736\" cy=\"646\" r=\"3\"/><circle cx=\"909\" cy=\"729\" r=\"1\"/><circle cx=\"1082\" cy=\"812\" r=\"2\"/><circle cx=\"1255\" cy=\"575\" r=\"3\"/><circle cx=\"1428\" cy=\"658\" r=\"1\"/><circle cx=\"1\" cy=\"741\" r=\"2\"/><circle cx=\"174\" cy=\"824\" r=\"3\"/><circle cx=\"347\" cy=\"587\" r=\"1\"/><circle cx=\"520\" cy=\"670\" r=\"2\"/><circle cx=\"693\" cy=\"753\" r=\"3\"/><circle cx=\"866\" cy=\"836\" r=\"1\"/><circle cx=\"1039\" cy=\"599\" r=\"2\"/><circle cx=\"1212\" cy=\"682\" r=\"3\"/><circle cx=\"1385\" cy=\"765\" r=\"1\"/><circle cx=\"1558\" cy=\"848\" r=\"2\"/><circle cx=\"131\" cy=\"611\" r=\"3\"/><circle cx=\"304\" cy=\"694\" r=\"1\"/><circle cx=\"477\" cy=\"777\" r=\"2\"/><circle cx=\"650\" cy=\"860\" r=\"3\"/><circle cx=\"823\" cy=\"623\" r=\"1\"/></g></svg>","viet":"<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" xmlns=\"http://www.w3.org/2000/svg\"><g class=\"v14-silk\"><path d=\"M-100 130Q350-80 800 150T1700 120V270Q1150 180 800 310T-100 270Z\"/><path d=\"M-100 230Q350 10 800 245T1700 210V295Q1100 250 800 355T-100 320Z\"/></g><g class=\"v14-star\"><polygon points=\"800,118 826.3327793027028,193.75603865200236 906.5183298250572,195.3900966300059 842.6073319300228,243.84396134799763 865.831948256757,320.60990336999413 800,274.8 734.168051743243,320.60990336999413 757.3926680699772,243.84396134799766 693.4816701749428,195.3900966300059 773.6672206972972,193.75603865200236 \"/></g><g class=\"v14-drum\"><ellipse cx=\"800\" cy=\"655\" rx=\"650\" ry=\"170\"/><ellipse cx=\"800\" cy=\"655\" rx=\"190\" ry=\"50\"/><ellipse cx=\"800\" cy=\"655\" rx=\"275\" ry=\"72\"/><ellipse cx=\"800\" cy=\"655\" rx=\"360\" ry=\"94\"/><ellipse cx=\"800\" cy=\"655\" rx=\"445\" ry=\"116\"/><ellipse cx=\"800\" cy=\"655\" rx=\"530\" ry=\"138\"/><ellipse cx=\"800\" cy=\"655\" rx=\"615\" ry=\"160\"/><path d=\"M1335 655l55 0\"/><path d=\"M1330.4230008349887 673.1431407185871l54.52946737555957 1.827366691080722\"/><path d=\"M1316.7703170646514 690.9758472692504l53.12592044589876 3.6234666314352904\"/><path d=\"M1294.2755498935385 708.1929970987475l50.81337428812077 5.357568053111257\"/><path d=\"M1263.3235910246747 724.5l47.63139720814413 6.999999999999999\"/><path d=\"M1224.444037055811 739.6178386322122l43.63443371601793 8.52266000612209\"/><path d=\"M1178.302127934803 753.2878425849301l38.890872965260115 9.899494936611664\"/><path d=\"M1125.6873645196656 765.2761143004817l33.481878595479635 11.106946764077293\"/><path d=\"M1067.5 775.377531126037l27.500000000000007 12.12435565298214\"/><path d=\"M1004.7356363153231 783.4192550190688l21.04758878007994 12.934313455158014\"/><path d=\"M938.4681891298486 789.2636898541805l14.235047480638642 13.522961568046956\"/><path d=\"M869.8315128377277 792.8108357309596l7.178940572102844 13.880228059233346\"/><path d=\"M800 794l3.3677786976552213e-15 14\"/><path d=\"M730.1684871622724 792.8108357309596l-7.178940572102838 13.880228059233346\"/><path d=\"M661.5318108701515 789.2636898541805l-14.235047480638634 13.522961568046956\"/><path d=\"M595.2643636846772 783.4192550190689l-21.047588780079924 12.934313455158016\"/><path d=\"M532.5000000000001 775.377531126037l-27.49999999999999 12.124355652982143\"/><path d=\"M474.31263548033445 765.2761143004817l-33.481878595479635 11.106946764077293\"/><path d=\"M421.6978720651971 753.2878425849301l-38.89087296526011 9.899494936611665\"/><path d=\"M375.5559629441892 739.6178386322122l-43.63443371601793 8.522660006122091\"/><path d=\"M336.6764089753253 724.5l-47.63139720814413 6.999999999999999\"/><path d=\"M305.7244501064616 708.1929970987475l-50.81337428812077 5.357568053111258\"/><path d=\"M283.2296829353485 690.9758472692504l-53.12592044589875 3.6234666314352943\"/><path d=\"M269.57699916501144 673.1431407185872l-54.52946737555957 1.8273666910807278\"/><path d=\"M265 655l-55 1.7145055188062944e-15\"/><path d=\"M269.57699916501144 636.8568592814128l-54.52946737555957 -1.8273666910807247\"/><path d=\"M283.2296829353485 619.0241527307496l-53.12592044589876 -3.6234666314352912\"/><path d=\"M305.7244501064615 601.8070029012525l-50.81337428812078 -5.3575680531112555\"/><path d=\"M336.6764089753252 585.5l-47.631397208144136 -6.9999999999999964\"/><path d=\"M375.55596294418916 570.3821613677878l-43.63443371601793 -8.52266000612209\"/><path d=\"M421.69787206519686 556.7121574150699l-38.89087296526014 -9.89949493661166\"/><path d=\"M474.31263548033434 544.7238856995184l-33.48187859547965 -11.10694676407729\"/><path d=\"M532.4999999999998 534.622468873963l-27.500000000000025 -12.124355652982139\"/><path d=\"M595.2643636846772 526.5807449809311l-21.047588780079924 -12.934313455158016\"/><path d=\"M661.5318108701515 520.7363101458195l-14.235047480638634 -13.522961568046956\"/><path d=\"M730.1684871622724 517.1891642690404l-7.17894057210284 -13.880228059233346\"/><path d=\"M799.9999999999999 516l-1.0103336092965664e-14 -14\"/><path d=\"M869.8315128377275 517.1891642690404l7.17894057210282 -13.880228059233346\"/><path d=\"M938.4681891298484 520.7363101458195l14.235047480638617 -13.522961568046957\"/><path d=\"M1004.7356363153227 526.5807449809311l21.047588780079906 -12.934313455158017\"/><path d=\"M1067.5 534.622468873963l27.500000000000007 -12.12435565298214\"/><path d=\"M1125.6873645196652 544.7238856995182l33.48187859547959 -11.1069467640773\"/><path d=\"M1178.302127934803 556.7121574150699l38.8908729652601 -9.899494936611667\"/><path d=\"M1224.4440370558107 570.3821613677878l43.634433716017924 -8.522660006122091\"/><path d=\"M1263.3235910246744 585.5l47.63139720814411 -7.000000000000006\"/><path d=\"M1294.2755498935385 601.8070029012525l50.81337428812078 -5.357568053111254\"/><path d=\"M1316.7703170646514 619.0241527307495l53.12592044589874 -3.623466631435302\"/><path d=\"M1330.4230008349887 636.8568592814128l54.52946737555957 -1.8273666910807236\"/><polygon points=\"800,525 830.5648331192086,612.9311162925028 923.6373471183699,614.8277907312569 849.454938847348,671.0688837074972 876.4120827980215,760.1722092687431 800,707 723.5879172019785,760.1722092687431 750.545061152652,671.0688837074973 676.3626528816301,614.8277907312569 769.4351668807914,612.9311162925028 \" transform=\"translate(0 491.25) scale(1 .25)\"/></g><g class=\"v14-landmarks\"><path d=\"M260 570V455H390V570M248 455H402L365 420H287ZM277 448V388H375V448M268 388H385L354 355H301Z\"/><path d=\"M670 570V430H940V570M655 430H955L930 400H680ZM700 450V555M742 450V555M784 450V555M826 450V555M868 450V555M910 450V555\"/><path d=\"M1130 570V415H1250V570M1120 415H1260L1220 365H1160ZM1155 415V340H1225V415M1145 340H1235L1190 305Z\"/></g><g class=\"v14-bamboo\"><g transform=\"translate(35 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(58 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(81 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(104 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(127 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(150 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1435 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1458 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1481 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1504 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1527 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g><g transform=\"translate(1550 0)\"><path d=\"M0 900Q-20 540 15 330\"/><path d=\"M5 380q-85-80 -65-125q5550 65125\"/><path d=\"M0 445q85-80 65-125q-5550 -65125\"/><path d=\"M5 510q-85-80 -65-125q5550 65125\"/><path d=\"M0 575q85-80 65-125q-5550 -65125\"/><path d=\"M5 640q-85-80 -65-125q5550 65125\"/><path d=\"M0 705q85-80 65-125q-5550 -65125\"/><path d=\"M5 770q-85-80 -65-125q5550 65125\"/></g></g><g class=\"v14-birds\"><path transform=\"translate(-20 500) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(100 538) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(220 576) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(340 500) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(460 538) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(580 576) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(700 500) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(820 538) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(940 576) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(1060 500) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(1180 538) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(1300 576) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(1420 500) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/><path transform=\"translate(1540 538) scale(.65)\" d=\"M0 0l35-17 25-45 5 37 55-8-42 25 15 20-34-9-32 30 12-28Z\"/></g><g class=\"v14-parade\"><path transform=\"translate(-40 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(8 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(56 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(104 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(152 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(200 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(248 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(296 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(344 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(392 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(440 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(488 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(536 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(584 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(632 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(680 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(728 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(776 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(824 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(872 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(920 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(968 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1016 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1064 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1112 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1160 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1208 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1256 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1304 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1352 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1400 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1448 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1496 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1544 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1592 810)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/><path transform=\"translate(1640 825)\" d=\"M0 0V-65m0 3q24-15 40 0v32q-24-15-40 0\"/></g><g class=\"v14-lotus\"><path transform=\"translate(0 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(160 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(320 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(480 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(640 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(800 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(960 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(1120 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(1280 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(1440 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/><path transform=\"translate(1600 850)\" d=\"M0 0Q-75-25-60-65Q-20-65 0-15Q-30-70 0-105Q30-70 0-15Q20-65 60-65Q75-25 0 0Z\"/></g></svg>"});
    Object.assign(LUX_CONFIG10,{"summer":{"id":"summer","runtime":"Summer","root":"summer-solstice-equipped","world":"summer-solstice-world","ui":"summer-solstice-ui-frame","realm":"summer-solstice-pet-realm","pet":"summer-solstice-pet","effect":"premium-summer-solstice-magic","stage":"pet-summer-solstice-stage","css":"premium-mua-xuan","color":"#ffdd83","bg":"#063443","font":"Palatino Linotype, Georgia, serif","radius":"32px 7px 32px 7px","kicker":"HẠ THẦN / NHẬT DIỆU","title":"Lưu Kim · Hải Nhật Thiên Đài","subtitle":"Buồm đón bình minh · Sóng vàng dâng bậc trời"},"viet":{"id":"viet","runtime":"NationalDay","root":"national-day-luxury-equipped","world":"national-day-world-v4","ui":"national-day-interface-v4","realm":"national-day-realm-v14","pet":"national-day-pet-v14","effect":"national-day-chibi-star-magic","stage":"pet-national-day-stage-v14","css":"quoc-khanh-pet","color":"#ffe1a1","bg":"#531c25","font":"Georgia, serif","radius":"5px 5px 20px 20px","kicker":"VIỆT DIỆU / HỒN THIÊNG","title":"Độc Lập · Sơn Hà Rạng Rỡ","subtitle":"Dải lụa đỏ · Nhịp trống đồng · Sen nở quê hương"}});
    Object.assign(LUX_GLYPHS10,{summer:'<svg viewBox="0 0 104 64"><path d="M8 45Q50 8 96 45M8 54H96M50 5V20M15 15L25 28M85 15L75 28"/><circle cx="50" cy="36" r="14"/></svg>',viet:'<svg viewBox="0 0 104 64"><path d="M52 3L61 25H86L66 39 74 61 52 47 30 61 38 39 18 25H43Z"/></svg>'});
    function luxuryPolicy13(){return window.EffectQualityManager?.getLuxuryPolicy?.()||{level:'high',pointerEnabled:true,countScale:1,trailInterval:70,trailLimit:10,tapCount:7};}
    function installLuxuryGestures10(runtime, id, root, tap) {
        runtime.gesture10?.abort();runtime.gesture10Id=id;
        const controller = runtime.gesture10 = new AbortController(), {signal}=controller;
        let press=null, last=null, lastTime=0;
        const valid=()=>!document.hidden&&luxuryPolicy13().pointerEnabled&&document.documentElement.classList.contains(root);
        const blocked=e=>e.target?.closest?.('#virtual-pet-container,input,textarea,select,[contenteditable="true"],input[type="range"]');
        document.addEventListener('pointerdown',e=>{
            if(!valid()||e.button!==0||e.isPrimary===false||blocked(e)){press=null;return;}
            press={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
        },{signal,passive:true,capture:true});
        document.addEventListener('pointermove',e=>{
            if(press&&press.id===e.pointerId&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10)press.moved=true;
            if(!valid()||blocked(e)||e.isPrimary===false||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
            if(e.pointerType==='touch'&&!press)return;
            const now=performance.now(),x=e.clientX,y=e.clientY;
            if(now-lastTime<luxuryPolicy13().trailInterval||last&&Math.hypot(x-last.x,y-last.y)<18)return;
            lastTime=now;
            const old=document.querySelectorAll('[data-gesture10="'+id+'"]');if(old.length>=luxuryPolicy13().trailLimit)old[0].remove();
            const n=document.createElement('div');n.className='lux-pointer10 lp10-'+id;n.dataset.gesture10=id;n.setAttribute('aria-hidden','true');
            n.style.cssText='--px:'+x+'px;--py:'+y+'px;--turn:'+Math.atan2(y-(last?.y??y),x-(last?.x??x))*180/Math.PI+'deg';
            n.innerHTML=LUX_GLYPHS10[id];document.body.appendChild(n);last={x,y};
            const later=runtime.realmLater||runtime.later||runtime.setTimer;later.call(runtime,()=>n.remove(),1100);
        },{signal,passive:true,capture:true});
        document.addEventListener('pointerup',e=>{
            const p=press;press=null;if(!valid()||!p||p.id!==e.pointerId||p.moved||blocked(e)||Math.hypot(e.clientX-p.x,e.clientY-p.y)>10)return;
            tap(e.clientX,e.clientY);
        },{signal,passive:true,capture:true});
        for(const type of ['pointercancel','scroll','visibilitychange'])document.addEventListener(type,()=>{press=null;last=null;},{signal,passive:true,capture:true});
        window.addEventListener('blur',()=>{press=null;last=null;},{signal});
    }
    function luxuryTapBloom11(runtime,id,x,y){
        const policy= luxuryPolicy13();if(!policy.pointerEnabled)return;
        const now=performance.now();if(document.hidden||now-(runtime.lastSmallTap12??-1000)<80)return;runtime.lastSmallTap12=now;
        const colors={summer:'#ffe39b',viet:'#ffdc76',rose:'#ff8ec5',cat:'#89ffce',moon:'#c9e3ff',cuoi:'#e6d18a',cheng:'#ffcc79',klein:'#c8a3ff',aether:'#fff0ad',cam:'#76e4d4',nyx:'#c5a8ff',starry:'#ffe273',autumn:'#ffc66e',hacmong:'#b0ffe9'};
        const old=document.querySelectorAll('[data-gesture10="'+id+'"]');if(old.length>=5)old[0].remove();
        const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
        const n=document.createElement('div');n.dataset.gesture10=id;n.className='lux-tap-bloom11';n.setAttribute('aria-hidden','true');
        n.style.cssText='position:fixed!important;left:'+x+'px!important;top:'+y+'px!important;width:0!important;height:0!important;pointer-events:none!important;z-index:2147483000!important;color:'+colors[id]+';';
        const glyph=LUX_GLYPHS10[id].replace('<svg ','<svg style="width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;overflow:visible;pointer-events:none" ');
        for(let i=0;i<policy.tapCount;i++){
            const p=document.createElement('span'),center=i===0,angle=(i-1)*Math.PI*2/(policy.tapCount-1);
            p.style.cssText='position:absolute;pointer-events:none;width:'+(center?36:16)+'px;height:'+(center?24:11)+'px;left:'+(center?-18:-8)+'px;top:'+(center?-12:-5.5)+'px;filter:drop-shadow(0 0 3px currentColor)';
            p.innerHTML=glyph;n.appendChild(p);
            const dx=center?0:Math.cos(angle)*39,dy=center?0:Math.sin(angle)*39;
            p.animate(reduced?[{opacity:.7},{opacity:0}]:[{transform:'translate(0,0) scale(.15)',opacity:0},{offset:.2,opacity:1},{transform:'translate('+dx+'px,'+dy+'px) scale('+(center?1.25:.6)+')',opacity:0}],{duration:reduced?250:650,easing:'cubic-bezier(.15,.65,.3,1)',fill:'forwards'});
        }
        document.body.appendChild(n);const later=runtime.realmLater||runtime.later||runtime.setTimer;later.call(runtime,()=>n.remove(),reduced?280:700);
    }

    function clearLuxuryGestures10(runtime){runtime.gesture10?.abort();runtime.gesture10=null;if(runtime.gesture10Id)document.querySelectorAll('[data-gesture10="'+runtime.gesture10Id+'"]').forEach(n=>n.remove());}
    function luxuryScene10(runtime,mode,x=innerWidth/2,y=innerHeight/2){
        const c=runtime.design10();const n=document.createElement('div');n.className='lux10 lux10-'+c.id+' lux10-'+mode;n.dataset.scene10=c.id;n.setAttribute('aria-hidden','true');
        n.style.setProperty('--impact-x',x+'px');n.style.setProperty('--impact-y',y+'px');
        n.innerHTML=LUX_ART10[c.id]+(mode==='ultimate'?'<div class="lux10-caption"><small>'+c.kicker+'</small><strong>'+c.title+'</strong><span>'+c.subtitle+'</span></div>':'');
        document.body.appendChild(n);return n;
    }
    function luxuryUltimate10(runtime,x,y){
        const c=runtime.design10(),pet=document.getElementById('virtual-pet-img'),box=pet?.closest('#virtual-pet-container');
        if(runtime.sceneLocked10||document.hidden||!document.documentElement.classList.contains(c.root)||!pet||box?.hidden||box?.style.display==='none'||box?.dataset.petDragged==='1')return false;
        runtime.sceneLocked10=true;const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,n=luxuryScene10(runtime,'ultimate',x,y);
        runtime.setTimer(()=>n.remove(),reduced?1300:8400);runtime.setTimer(()=>runtime.sceneLocked10=false,reduced?1600:8800);return true;
    }
    function luxuryPet10(runtime){
        const c=runtime.design10(),pet=document.getElementById('virtual-pet-img'),box=pet?.closest('#virtual-pet-container');if(!pet||!box)return false;
        if(runtime.pet10===pet){if(!box.querySelector('.'+c.realm)){const n=luxuryScene10(runtime,'realm');n.classList.add(c.realm);box.prepend(n);}return true;}
        for(const [k,v]of Object.entries(runtime.attrs10||{})){if(v===null)runtime.pet10?.removeAttribute(k);else runtime.pet10?.setAttribute(k,v);}
        runtime.sceneObserver10?.disconnect();document.querySelectorAll('.lux10-'+c.id+'.lux10-realm').forEach(n=>n.remove());
        runtime.petAbort10?.abort();runtime.petAbort10=new AbortController();const {signal}=runtime.petAbort10;
        runtime.pet10=pet;runtime.attrs10=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));
        pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',c.title);pet.classList.add(c.pet);box.classList.add(c.stage);
        const n=luxuryScene10(runtime,'realm');n.classList.add(c.realm);box.prepend(n);
        const cast=e=>{if(box.dataset.petDragged==='1'||window.PetInteractionManager?.isPetDragging)return;e.preventDefault();e.stopImmediatePropagation();const r=pet.getBoundingClientRect();luxuryUltimate10(runtime,r.x+r.width/2,r.y+r.height/2);};
        pet.addEventListener('click',cast,{capture:true,signal});pet.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){box.dataset.petDragged='0';cast(e);}},{signal});
        runtime.sceneObserver10=new MutationObserver(()=>{if(!pet.isConnected||box.hidden||box.style.display==='none'||box.style.visibility==='hidden')runtime.clear();});
        runtime.sceneObserver10.observe(box.parentNode,{subtree:true,childList:true,attributes:true,attributeFilter:['style','hidden']});
        document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-scene10="'+c.id+'"]').forEach(n=>n.classList.toggle('lux10-paused',document.hidden)),{signal});
        return true;
    }
    function clearLuxuryScene10(runtime){
        clearLuxuryGestures10(runtime);runtime.petAbort10?.abort();runtime.sceneObserver10?.disconnect();runtime.sceneLocked10=false;runtime.lastTap10=-1000;
        for(const [k,v]of Object.entries(runtime.attrs10||{})){if(v===null)runtime.pet10?.removeAttribute(k);else runtime.pet10?.setAttribute(k,v);}
        runtime.pet10=null;runtime.attrs10=null;const c=runtime.design10();document.querySelectorAll('[data-scene10="'+c.id+'"]').forEach(n=>n.remove());document.documentElement.classList.remove('lux10-'+c.id+'-equipped');
    }

    const LuxuryAutumnRuntime = {
        controller: null, observer: null, pet: null, container: null,
        timers: new Set(), locked: false, lastClick: 0,
        reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
        later(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },
        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.controller?.abort();
            this.observer?.disconnect();
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
            document.querySelectorAll('[data-autumn3-runtime]').forEach(node => node.remove());
            document.documentElement.classList.remove('autumn3-equipped', 'autumn3-paused');
            this.container?.classList.remove('autumn3-pet-stage', 'autumn3-casting');
            if (this.pet) {
                for (const [name, value] of Object.entries(this.originalAttributes || {})) {
                    if (value === null) this.pet.removeAttribute(name);
                    else this.pet.setAttribute(name, value);
                }
            }
            this.controller = this.observer = this.pet = this.container = null;
            this.locked = false;
            this.lastClick = 0;
        },
        // Luxury-only ornaments share the existing runtime cleanup and reduced-motion policy.
        panoramaMarkup(kind) {
            return '<div class="autumn3-v8 v8-' + kind + '"><div class="v8-sky"></div><div class="v8-dawn"></div><svg class="v8-landscape" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="v8-distance"><path class="v8-ridge ridge-0" d="M-100 500L90 170L180 340L290 210L430 430L600 300L780 460L960 320L1100 430L1250 200L1350 330L1490 140L1700 530V1000H-100Z"/><path class="v8-ridge ridge-1" d="M-100 570L90 265L180 378L290 272L430 465L600 365L780 500L960 385L1100 470L1250 265L1350 375L1490 220L1700 590V1000H-100Z"/><path class="v8-ridge ridge-2" d="M-100 640L90 360L180 416L290 334L430 500L600 430L780 540L960 450L1100 510L1250 330L1350 420L1490 300L1700 650V1000H-100Z"/></g><g class="v8-road"><path class="v8-stone" d="M725 540H875L1320 950H280Z"/><path class="v8-step" d="M710 570H890l20 10H690Z"/><path class="v8-step" d="M706 572.1H894l20 10H686Z"/><path class="v8-step" d="M694 578.4H906l20 10H674Z"/><path class="v8-step" d="M674 588.9H926l20 10H654Z"/><path class="v8-step" d="M646 603.6H954l20 10H626Z"/><path class="v8-step" d="M610 622.5H990l20 10H590Z"/><path class="v8-step" d="M566 645.6H1034l20 10H546Z"/><path class="v8-step" d="M514 672.9H1086l20 10H494Z"/><path class="v8-step" d="M454 704.4H1146l20 10H434Z"/><path class="v8-step" d="M386 740.1H1214l20 10H366Z"/><path class="v8-step" d="M310 780H1290l20 10H290Z"/><path class="v8-step" d="M226 824.1H1374l20 10H206Z"/><path class="v8-trim" d="M720 545L235 930M880 545L1365 930M705 545L180 930M895 545L1420 930"/></g><g class="v8-palace"><g class="v8-gate" style="--depth:0" transform="translate(800 410) scale(0.32)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">PHONG DIỆP</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:1" transform="translate(800 430) scale(0.62)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">PHONG DIỆP</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:2" transform="translate(800 435) scale(1)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">PHONG DIỆP</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:3" transform="translate(800 455) scale(1.6)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">PHONG DIỆP</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g></g><g class="v8-tree" style="--depth:0" transform="translate(80 680) scale(1 1)"><path class="v8-bark" d="M0 90Q35-80 12-320L30-328Q62-184 39-95Q78-163 150-184L156-174Q75-122 32-14L24 90ZM27-220Q-30-298-91-313L-89-325Q-17-321 35-260Z"/><g transform="translate(0 -323) rotate(0)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(97.01956845835082 -284.8450913870556) rotate(27)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-114.19224886674193 -205.45981256658717) rotate(54)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(37.38496362160544 -157.83062278216303) rotate(81)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(70.1900631470114 -185.74757946832023) rotate(108)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-119.99882478608441 -263.5439613934478) rotate(135)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(71.04882176486694 -319.6941337919804) rotate(162)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(36.37420280948407 -302.5738871104943) rotate(189)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-113.86133975017488 -227.92349719388508) rotate(216)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(97.64084850085264 -164.3761882635718) rotate(243)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g></g><g class="v8-tree" style="--depth:1" transform="translate(1520 680) scale(-1 1)"><path class="v8-bark" d="M0 90Q35-80 12-320L30-328Q62-184 39-95Q78-163 150-184L156-174Q75-122 32-14L24 90ZM27-220Q-30-298-91-313L-89-325Q-17-321 35-260Z"/><g transform="translate(0 -323) rotate(0)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(97.01956845835082 -284.8450913870556) rotate(27)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-114.19224886674193 -205.45981256658717) rotate(54)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(37.38496362160544 -157.83062278216303) rotate(81)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(70.1900631470114 -185.74757946832023) rotate(108)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-119.99882478608441 -263.5439613934478) rotate(135)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(71.04882176486694 -319.6941337919804) rotate(162)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(36.37420280948407 -302.5738871104943) rotate(189)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(-113.86133975017488 -227.92349719388508) rotate(216)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(97.64084850085264 -164.3761882635718) rotate(243)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g></g><g class="v8-flight"><g transform="translate(-100 390) rotate(0) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(0 505.9591837027844) rotate(33) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(100 567.3809513979228) rotate(66) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(200 545.3776859967973) rotate(99) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(300 450.2978670280629) rotate(132) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(400 326.8590190158684) rotate(165) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(500 233.1163609655542) rotate(198) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(600 213.15852972762013) rotate(231) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(700 276.3720051829821) rotate(264) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(800 393.02650208718296) rotate(297) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(900 508.25758776938204) rotate(330) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1000 567.87028209786) rotate(363) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1100 543.8278034558907) rotate(396) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1200 447.4377052228834) rotate(429) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1300 324.0337567346532) rotate(462) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1400 231.65476320509939) rotate(495) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1500 213.74800875276287) rotate(528) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g><g transform="translate(1600 278.7353197973338) rotate(561) scale(.35)"><path class="v8-foliage" d="M0-60L13-28L40-42L32-12L62-3L29 17L36 46L9 36L0 63L-9 36L-36 46L-29 17L-62-3L-32-12L-40-42L-13-28Z"/><path class="v8-trim" d="M0-43V42M-35-3L0 15L35-3"/></g></g><g class="v8-river"><path class="v8-current current-0" style="--i:0" d="M-200 570C200 70 520 960 890 490S1420 150 1810 410"/><path class="v8-current current-1" style="--i:1" d="M-200 586C200 102 520 943 890 502S1420 174 1810 430"/><path class="v8-current current-2" style="--i:2" d="M-200 602C200 134 520 926 890 514S1420 198 1810 450"/><path class="v8-current current-3" style="--i:3" d="M-200 618C200 166 520 909 890 526S1420 222 1810 470"/><path class="v8-current current-4" style="--i:4" d="M-200 634C200 198 520 892 890 538S1420 246 1810 490"/></g><g class="v8-rain"><path style="--i:0" d="M-70 -90l-28 120"/><path style="--i:1" d="M3 -90l-28 120"/><path style="--i:2" d="M76 -90l-28 120"/><path style="--i:3" d="M149 -90l-28 120"/><path style="--i:4" d="M222 -90l-28 120"/><path style="--i:5" d="M295 -90l-28 120"/><path style="--i:6" d="M368 -90l-28 120"/><path style="--i:7" d="M441 -90l-28 120"/><path style="--i:8" d="M514 -90l-28 120"/><path style="--i:9" d="M587 -90l-28 120"/><path style="--i:10" d="M660 -90l-28 120"/><path style="--i:11" d="M733 -90l-28 120"/><path style="--i:12" d="M806 -90l-28 120"/><path style="--i:13" d="M879 -90l-28 120"/><path style="--i:14" d="M952 -90l-28 120"/><path style="--i:15" d="M1025 -90l-28 120"/><path style="--i:16" d="M1098 -90l-28 120"/><path style="--i:17" d="M1171 -90l-28 120"/><path style="--i:18" d="M1244 -90l-28 120"/><path style="--i:19" d="M1317 -90l-28 120"/><path style="--i:20" d="M1390 -90l-28 120"/><path style="--i:21" d="M1463 -90l-28 120"/><path style="--i:22" d="M1536 -90l-28 120"/><path style="--i:23" d="M1609 -90l-28 120"/></g></svg><div class="v8-mist mist-one"></div><div class="v8-mist mist-two"></div><div class="v8-letterbox"></div></div>';
        },
        coutureMarkup(kind) {
            const ring = '<svg class="autumn3-v7-wheel" viewBox="0 0 400 400" fill="none" aria-hidden="true"><circle cx="200" cy="200" r="186"/><circle cx="200" cy="200" r="175" stroke-dasharray="1 8"/><circle cx="200" cy="200" r="150"/><path d="M200 14L361 293H39Z M200 386L39 107H361Z"/>' +
                Array.from({length:12},(_,i)=>'<g transform="rotate('+i*30+' 200 200)"><path d="M200 20L208 38L200 56L192 38Z"/><path d="M200 58V76"/></g>').join('')+'</svg>';
            const petals=Array.from({length: 9},(_,i)=>'<i style="--n:'+i+';--a:'+i*40+'deg"></i>').join('');
            return '<div class="autumn3-v7 '+kind+'"><div class="v7-mandala">'+ring+'</div><div class="v7-crown">'+petals+'</div><div class="v7-ribbon ribbon-one"></div><div class="v7-ribbon ribbon-two"></div><div class="v7-stars">'+Array.from({length:12},(_,i)=>'<i style="--n:'+i+';--a:'+i*30+'deg;--r:'+(90+(i%3)*35)+'px"></i>').join('')+'</div><div class="v7-floor"></div></div>';
        },
        layer(className, markup, parent = document.body) {
            const node = document.createElement('div');
            node.className = className;
            node.dataset.autumn3Runtime = 'true';
            node.setAttribute('aria-hidden', 'true');
            node.innerHTML = markup;
            const kind = className.includes('autumn3-world') ? 'v7-world' :
                className.includes('autumn3-realm') ? 'v7-realm' :
                className === 'autumn3-click' ? 'v7-click' : className === 'autumn3-ultimate' ? 'v7-ultimate' : '';
            if (kind) {
                node.insertAdjacentHTML('beforeend', this.coutureMarkup(kind));
                if (kind !== 'v7-realm') node.insertAdjacentHTML('beforeend', this.panoramaMarkup(kind.slice(3)));
                if (kind === 'v7-ultimate' && this.pet) {
                    const portrait = document.createElement('img');
                    portrait.className = 'autumn3-v7-portrait';
                    portrait.src = this.pet.currentSrc || this.pet.src;
                    portrait.alt = ''; portrait.decoding = 'async';
                    node.appendChild(portrait);
                }
            }
            parent.appendChild(node);
            return node;
        },
        leaves(parent, count, burst = false) {
            const total = this.reduced() ? 0 : Math.min(64, getLuxuryQualityCount(count));
            for (let i = 0; i < total; i++) {
                const leaf = document.createElement('i');
                leaf.className = 'autumn3-leaf';
                const angle = i / total * Math.PI * 2;
                const radius = 55 + Math.random() * (burst ? 220 : 100);
                leaf.style.cssText = `--x:${Math.random() * 100}%;--size:${8 + Math.random() * 14}px;` +
                    `--duration:${12 + Math.random() * 16}s;--delay:${-Math.random() * 28}s;` +
                    `--drift:${Math.random() * 200 - 100}px;--turn:${Math.random() * 360}deg;` +
                    `--dx:${Math.cos(angle) * radius}px;--dy:${Math.sin(angle) * radius}px;` +
                    `--leaf-color:${['#d87821', '#a93620', '#f4bf62', '#b65123'][i % 4]};`;
                parent.appendChild(leaf);
            }
        },
        // Decorative geometry is generated once per mount; CSS animates the layers.
        branchMarkup() {
            const leaves = Array.from({ length: 9 }, (_, i) => {
                const x = 30 + i * 28, y = 110 - i * 9;
                return `<g transform="translate(${x} ${y}) rotate(-18)">
                    <path opacity=".85" d="M0 0C-12-4-21-17-16-29C-3-26 4-12 0 0Z"/>
                    <path opacity=".65" d="M0 0C10 2 22-3 25-15C12-19 2-10 0 0Z"/>
                    <path d="M-13-24L0 0L21-12" fill="none" stroke="#ffe5a8" stroke-width=".8" opacity=".8"/></g>`;
            }).join('');
            return `<svg viewBox="0 0 300 150" fill="currentColor" aria-hidden="true"><path d="M5 119Q150 78 285 28" fill="none" stroke="currentColor" stroke-width="1.5"/>${leaves}</svg>`;
        },
        motes(parent, count, orbit = false) {
            const total = this.reduced() ? 0 : Math.min(40, getLuxuryQualityCount(count));
            for (let i = 0; i < total; i++) {
                const mote = document.createElement('i');
                mote.className = orbit ? 'autumn4-orbit-mote' : 'autumn4-mote';
                mote.style.cssText = `--mx:${Math.random() * 100}%;--my:${Math.random() * 100}%;` +
                    `--angle:${i * 360 / total}deg;--speed:${8 + Math.random() * 12}s;` +
                    `--wait:${-Math.random() * 20}s;--radius:${65 + Math.random() * 30}px;`;
                parent.appendChild(mote);
            }
        },
        createWorld() {
            const world = this.layer('autumn3-world autumn4-world', `
                <div class="autumn3-horizon"></div><div class="autumn3-rays"></div>
                <div class="autumn4-sun-disc"><i></i><i></i></div>
                <div class="autumn4-silk silk-a"></div><div class="autumn4-silk silk-b"></div>
                <div class="autumn4-canopy canopy-left">${this.branchMarkup()}</div>
                <div class="autumn4-canopy canopy-right">${this.branchMarkup()}</div>
                <div class="autumn4-fall fall-far"></div><div class="autumn4-fall fall-near"></div>
                <div class="autumn4-fireflies"></div><div class="autumn4-ground-glow"></div>`);
            const mobile = window.innerWidth < 600;
            this.leaves(world.querySelector('.fall-far'), mobile ? 9 : 18);
            this.leaves(world.querySelector('.fall-near'), mobile ? 7 : 14);
            this.motes(world.querySelector('.autumn4-fireflies'), mobile ? 12 : 28);
            this.layer('autumn3-frame autumn4-frame', `<i></i><i></i><i></i><span class="autumn4-border-vine vine-left">${this.branchMarkup()}</span><span class="autumn4-border-vine vine-right">${this.branchMarkup()}</span>`);
        },
        createRealm(container) {
            const realm = this.layer('autumn3-realm autumn4-realm', `
                <span class="autumn3-pet-halo"></span>
                <div class="autumn4-astrolabe"><i class="ring-outer"></i><i class="ring-inner"></i>
                    <span class="autumn4-runes">✧ · ◇ · ✦ · ◇ · ✧</span></div>
                <div class="autumn4-laurel laurel-left">${this.branchMarkup()}</div>
                <div class="autumn4-laurel laurel-right">${this.branchMarkup()}</div>
                <div class="autumn4-pendants"><i></i><i></i><i></i><i></i></div>
                <div class="autumn4-orbit-field"></div>
                <div class="autumn4-pet-dust"></div>
                <div class="autumn4-pedestal"><i></i><i></i><i></i></div>
                <span class="autumn3-pet-sigil">✧</span>`, container);
            this.motes(realm.querySelector('.autumn4-orbit-field'), 12, true);
            this.motes(realm.querySelector('.autumn4-pet-dust'), 14);
            const front = this.layer('autumn4-realm-front', '<div class="autumn4-foot-leaves"></div><span class="autumn4-comet"></span>', container);
            this.leaves(front.querySelector('.autumn4-foot-leaves'), 8);
        },

        clickBurst(x,y) {if(!document.documentElement.classList.contains('autumn3-equipped'))return;return luxuryTapBloom11(this,'autumn',x,y);
        },
        createUltimate() {
            if (!this.pet?.isConnected || this.locked || document.hidden ||
                this.container?.dataset.petDragged === '1') return;
            this.locked = true;
            this.container.classList.add('autumn3-casting');
            const ultimate = this.layer('autumn3-ultimate', `
                <div class="autumn3-veil"></div><div class="autumn3-aurora"></div>
                <div class="autumn3-equinox"><i></i><i></i><i></i><span>✦</span></div>
                <div class="autumn3-ultimate-leaves"></div>
                <div class="autumn4-ultimate-wreath wreath-left">${this.branchMarkup()}</div>
                <div class="autumn4-ultimate-wreath wreath-right">${this.branchMarkup()}</div>
                <div class="autumn4-ultimate-halo"><i></i><i></i></div>
                <div class="autumn4-ultimate-dust"></div>
                <div class="autumn3-caption"><small>THU THẦN THỨC TỈNH</small>
                    <strong>Vạn Diệp Quy Thu</strong><span>Ngàn lá phong · Một mùa rực rỡ</span></div>`);
            this.leaves(ultimate.querySelector('.autumn3-ultimate-leaves'), 48, true);
            this.motes(ultimate.querySelector('.autumn4-ultimate-dust'), 32);
            const duration = this.reduced() ? 1100 : 8200;
            this.later(() => ultimate.classList.add('is-ending'), duration - 600);
            this.later(() => {
                ultimate.remove();
                this.container?.classList.remove('autumn3-casting');
            }, duration);
            this.later(() => { this.locked = false; }, this.reduced() ? 1800 : 9200);
        },
        mount() {
            const pet = document.querySelector('#virtual-pet-img.autumn3-pet-magic');
            const container = pet?.closest('#virtual-pet-container');
            if (!pet || !container || container.hidden || container.style.display === 'none') return;
            this.clear();
            ensureAutumnStylesheet();
            this.pet = pet;
            this.container = container;
            this.controller = new AbortController();
            const { signal } = this.controller;
            document.documentElement.classList.add('autumn3-equipped');
            container.classList.add('autumn3-pet-stage');
            this.createWorld();
            this.createRealm(container);
            this.originalAttributes = Object.fromEntries(['tabindex', 'role', 'aria-label', 'title'].map(name => [name, pet.getAttribute(name)]));
            pet.setAttribute('tabindex', '0');
            pet.setAttribute('role', 'button');
            pet.setAttribute('aria-label', 'Thu Thần: kích hoạt Vạn Diệp Quy Thu');
            pet.title = 'Nhấn để thi triển Vạn Diệp Quy Thu';
            pet.addEventListener('click', () => this.createUltimate(), { signal });
            pet.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    container.dataset.petDragged = '0';
                    this.createUltimate();
                }
            }, { signal });
            installLuxuryGestures10(this,'autumn','autumn3-equipped',(x,y)=>this.clickBurst(x,y));;
            document.addEventListener('visibilitychange', () => {
                document.documentElement.classList.toggle('autumn3-paused', document.hidden);
            }, { signal });
            // Local observation catches close, unequip, replacement and remote inventory removal.
            this.observer = new MutationObserver(() => {
                if (!pet.isConnected || !pet.classList.contains('autumn3-pet-magic') ||
                    container.hidden || container.style.display === 'none' ||
                    container.style.visibility === 'hidden') this.clear();
            });
            this.observer.observe(container, { childList: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
            this.observer.observe(pet, { attributes: true, attributeFilter: ['class'] });
        },
        restore() {
            if (document.querySelector('#virtual-pet-img.autumn3-pet-magic')) this.mount();
        }
    };


    // HẠC MỘNG · VÂN TIÊU TIÊN VŨ — full suite owned only by this pet.
    const HAC_MONG_PREMIUM_PET = {
        id: 'pet_hac_mong_2', name: 'Hạc Mộng · Vân Tiêu Tiên Vũ',
        type: 'pet', price: 13000, isNonCoin: false, luxuryOnly: true, eventOnly: false,
        tag: 'Hạc Mộng', tags: ['Hạc Mộng', 'Tu tiên', 'Premium'],
        image: 'assets/Premium/Tu tiên/hac_mong_nhan_vat2.png',
        asset: 'assets/Premium/Tu tiên/hac_mong_nhan_vat2.png',
        value: 'assets/Premium/Tu tiên/hac_mong_nhan_vat2.png',
        luxuryTagImage: 'assets/Premium/Tu tiên/hac_mong_tag2.png', isIcon: false,
        petEffect: 'hacmong2-pet-magic', premiumSuite: 'hacmong2-jade-cloud-sanctuary',
        premiumLayers: ['world-effect', 'interface', 'pet-realm', 'global-click', 'ultimate'],
        disableClickEffect: true
    };

    function ensureHacMongStylesheet() {
        let link = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
            .find(node => /\/premium-hac-mong\.css(?:[?#]|$)/.test(node.href));
        if (!link) {
            link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'css/premium-hac-mong.css?v=20260927.realms10';
            document.head.appendChild(link);
        }
        link.id = 'hacmong2-premium-style';
        return link;
    }

    const LuxuryHacMongRuntime = {
        controller: null, observer: null, pet: null, container: null,
        timers: new Set(), locked: false, lastClick: 0,
        reduced() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; },
        later(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },
        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.controller?.abort();
            this.observer?.disconnect();
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
            document.querySelectorAll('[data-hacmong2-runtime]').forEach(node => node.remove());
            document.documentElement.classList.remove('hacmong2-equipped', 'hacmong2-paused');
            this.container?.classList.remove('hacmong2-pet-stage', 'hacmong2-casting');
            if (this.pet) {
                for (const [name, value] of Object.entries(this.originalAttributes || {})) {
                    if (value === null) this.pet.removeAttribute(name);
                    else this.pet.setAttribute(name, value);
                }
            }
            this.controller = this.observer = this.pet = this.container = null;
            this.locked = false;
            this.lastClick = 0;
        },
        // Luxury-only ornaments share the existing runtime cleanup and reduced-motion policy.
        panoramaMarkup(kind) {
            return '<div class="hacmong2-v8 v8-' + kind + '"><div class="v8-sky"></div><div class="v8-dawn"></div><svg class="v8-landscape" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="v8-distance"><path class="v8-ridge ridge-0" d="M-100 500L90 170L180 340L290 210L430 430L600 300L780 460L960 320L1100 430L1250 200L1350 330L1490 140L1700 530V1000H-100Z"/><path class="v8-ridge ridge-1" d="M-100 570L90 265L180 378L290 272L430 465L600 365L780 500L960 385L1100 470L1250 265L1350 375L1490 220L1700 590V1000H-100Z"/><path class="v8-ridge ridge-2" d="M-100 640L90 360L180 416L290 334L430 500L600 430L780 540L960 450L1100 510L1250 330L1350 420L1490 300L1700 650V1000H-100Z"/></g><g class="v8-road"><path class="v8-stone" d="M725 540H875L1320 950H280Z"/><path class="v8-step" d="M710 570H890l20 10H690Z"/><path class="v8-step" d="M706 572.1H894l20 10H686Z"/><path class="v8-step" d="M694 578.4H906l20 10H674Z"/><path class="v8-step" d="M674 588.9H926l20 10H654Z"/><path class="v8-step" d="M646 603.6H954l20 10H626Z"/><path class="v8-step" d="M610 622.5H990l20 10H590Z"/><path class="v8-step" d="M566 645.6H1034l20 10H546Z"/><path class="v8-step" d="M514 672.9H1086l20 10H494Z"/><path class="v8-step" d="M454 704.4H1146l20 10H434Z"/><path class="v8-step" d="M386 740.1H1214l20 10H366Z"/><path class="v8-step" d="M310 780H1290l20 10H290Z"/><path class="v8-step" d="M226 824.1H1374l20 10H206Z"/><path class="v8-trim" d="M720 545L235 930M880 545L1365 930M705 545L180 930M895 545L1420 930"/></g><g class="v8-palace"><g class="v8-gate" style="--depth:0" transform="translate(800 410) scale(0.32)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">VÂN TIÊU</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:1" transform="translate(800 430) scale(0.62)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">VÂN TIÊU</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:2" transform="translate(800 435) scale(1)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">VÂN TIÊU</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g><g class="v8-gate" style="--depth:3" transform="translate(800 455) scale(1.6)"><path class="v8-stone" d="M-180 310V-70H-145V310ZM145 310V-70H180V310Z"/><path class="v8-trim" d="M-172 310V-65M172 310V-65M-155 310V-65M155 310V-65"/><path class="v8-roof" d="M-235-80Q-175-92-150-125H150Q175-92 235-80L200-62H-200Z"/><path class="v8-roof" d="M-190-132Q-128-145-103-178H103Q128-145 190-132L158-115H-158Z"/><path class="v8-trim" d="M-235-80Q0-62 235-80M-190-132Q0-113 190-132M-145-46H145M-145-25H145"/><path class="v8-stone" d="M-57-59H57V-9H-57Z"/><path class="v8-trim" d="M-46-50H46V-18H-46Z"/><text x="0" y="-28" text-anchor="middle" class="v8-sign">VÂN TIÊU</text><path class="v8-trim" d="M-200-62V25M200-62V25"/><g class="v8-lantern"><path d="M-210 22H-190L-186 48L-200 68L-214 48ZM190 22H210L214 48L200 68L186 48Z"/><path class="v8-trim" d="M-200 68V95M200 68V95"/></g><path class="v8-trim" d="M-180 -79l8 -28M-180 -60v18l8 8l8 -8v-18 M-157.5 -79l8 -28M-157.5 -60v18l8 8l8 -8v-18 M-135 -79l8 -28M-135 -60v18l8 8l8 -8v-18 M-112.5 -79l8 -28M-112.5 -60v18l8 8l8 -8v-18 M-90 -79l8 -28M-90 -60v18l8 8l8 -8v-18 M-67.5 -79l8 -28M-67.5 -60v18l8 8l8 -8v-18 M-45 -79l8 -28M-45 -60v18l8 8l8 -8v-18 M-22.5 -79l8 -28M-22.5 -60v18l8 8l8 -8v-18 M0 -79l8 -28M0 -60v18l8 8l8 -8v-18 M22.5 -79l8 -28M22.5 -60v18l8 8l8 -8v-18 M45 -79l8 -28M45 -60v18l8 8l8 -8v-18 M67.5 -79l8 -28M67.5 -60v18l8 8l8 -8v-18 M90 -79l8 -28M90 -60v18l8 8l8 -8v-18 M112.5 -79l8 -28M112.5 -60v18l8 8l8 -8v-18 M135 -79l8 -28M135 -60v18l8 8l8 -8v-18 M157.5 -79l8 -28M157.5 -60v18l8 8l8 -8v-18 M180 -79l8 -28M180 -60v18l8 8l8 -8v-18"/><path class="v8-trim" d="M-163 10l8 14l-8 14l-8 -14Z M-163 58l8 14l-8 14l-8 -14Z M-163 106l8 14l-8 14l-8 -14Z M-163 154l8 14l-8 14l-8 -14Z M-163 202l8 14l-8 14l-8 -14Z M-163 250l8 14l-8 14l-8 -14Z M163 10l8 14l-8 14l-8 -14Z M163 58l8 14l-8 14l-8 -14Z M163 106l8 14l-8 14l-8 -14Z M163 154l8 14l-8 14l-8 -14Z M163 202l8 14l-8 14l-8 -14Z M163 250l8 14l-8 14l-8 -14Z"/><path class="v8-trim" d="M-193 310H-127M127 310H193M-196 322H-124M124 322H196"/></g></g><g class="v8-flight"><g class="v8-flock" style="--i:0" transform="translate(150 160) scale(0.5)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:1" transform="translate(355 230) scale(0.62)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:2" transform="translate(560 300) scale(0.74)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:3" transform="translate(765 160) scale(0.5)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:4" transform="translate(970 230) scale(0.62)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:5" transform="translate(1175 300) scale(0.74)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g><g class="v8-flock" style="--i:6" transform="translate(1380 160) scale(0.5)"><path d="M0 0Q-50-75-125-45Q-55-25-12 15L15 14Q65-30 120-70Q53-65 8 0L16-22L32-26L18-34Q0-30 0 0Z"/><path class="v8-trim" d="M-5 13L-50 40M3 14L-22 44"/></g></g><g class="v8-river"><path class="v8-current current-0" style="--i:0" d="M-200 570C200 70 520 960 890 490S1420 150 1810 410"/><path class="v8-current current-1" style="--i:1" d="M-200 586C200 102 520 943 890 502S1420 174 1810 430"/><path class="v8-current current-2" style="--i:2" d="M-200 602C200 134 520 926 890 514S1420 198 1810 450"/><path class="v8-current current-3" style="--i:3" d="M-200 618C200 166 520 909 890 526S1420 222 1810 470"/><path class="v8-current current-4" style="--i:4" d="M-200 634C200 198 520 892 890 538S1420 246 1810 490"/></g><g class="v8-rain"><path style="--i:0" d="M-70 -90l-28 120"/><path style="--i:1" d="M3 -90l-28 120"/><path style="--i:2" d="M76 -90l-28 120"/><path style="--i:3" d="M149 -90l-28 120"/><path style="--i:4" d="M222 -90l-28 120"/><path style="--i:5" d="M295 -90l-28 120"/><path style="--i:6" d="M368 -90l-28 120"/><path style="--i:7" d="M441 -90l-28 120"/><path style="--i:8" d="M514 -90l-28 120"/><path style="--i:9" d="M587 -90l-28 120"/><path style="--i:10" d="M660 -90l-28 120"/><path style="--i:11" d="M733 -90l-28 120"/><path style="--i:12" d="M806 -90l-28 120"/><path style="--i:13" d="M879 -90l-28 120"/><path style="--i:14" d="M952 -90l-28 120"/><path style="--i:15" d="M1025 -90l-28 120"/><path style="--i:16" d="M1098 -90l-28 120"/><path style="--i:17" d="M1171 -90l-28 120"/><path style="--i:18" d="M1244 -90l-28 120"/><path style="--i:19" d="M1317 -90l-28 120"/><path style="--i:20" d="M1390 -90l-28 120"/><path style="--i:21" d="M1463 -90l-28 120"/><path style="--i:22" d="M1536 -90l-28 120"/><path style="--i:23" d="M1609 -90l-28 120"/></g></svg><div class="v8-mist mist-one"></div><div class="v8-mist mist-two"></div><div class="v8-letterbox"></div></div>';
        },
        coutureMarkup(kind) {
            const ring = '<svg class="hacmong2-v7-wheel" viewBox="0 0 400 400" fill="none" aria-hidden="true"><circle cx="200" cy="200" r="186"/><circle cx="200" cy="200" r="175" stroke-dasharray="1 8"/><circle cx="200" cy="200" r="150"/><path d="M200 14L361 293H39Z M200 386L39 107H361Z"/>' +
                Array.from({length:12},(_,i)=>'<g transform="rotate('+i*30+' 200 200)"><path d="M200 20L208 38L200 56L192 38Z"/><path d="M200 58V76"/></g>').join('')+'</svg>';
            const petals=Array.from({length: 12},(_,i)=>'<i style="--n:'+i+';--a:'+i*30+'deg"></i>').join('');
            return '<div class="hacmong2-v7 '+kind+'"><div class="v7-mandala">'+ring+'</div><div class="v7-crown">'+petals+'</div><div class="v7-ribbon ribbon-one"></div><div class="v7-ribbon ribbon-two"></div><div class="v7-stars">'+Array.from({length:12},(_,i)=>'<i style="--n:'+i+';--a:'+i*30+'deg;--r:'+(90+(i%3)*35)+'px"></i>').join('')+'</div><div class="v7-floor"></div></div>';
        },
        layer(className, markup, parent = document.body) {
            const node = document.createElement('div');
            node.className = className;
            node.dataset.hacmong2Runtime = 'true';
            node.setAttribute('aria-hidden', 'true');
            node.innerHTML = markup;
            const kind = className.includes('hacmong2-world') ? 'v7-world' :
                className.includes('hacmong2-realm') ? 'v7-realm' :
                className === 'hacmong2-click' ? 'v7-click' : className === 'hacmong2-ultimate' ? 'v7-ultimate' : '';
            if (kind) {
                node.insertAdjacentHTML('beforeend', this.coutureMarkup(kind));
                if (kind !== 'v7-realm') node.insertAdjacentHTML('beforeend', this.panoramaMarkup(kind.slice(3)));
                if (kind === 'v7-ultimate' && this.pet) {
                    const portrait = document.createElement('img');
                    portrait.className = 'hacmong2-v7-portrait';
                    portrait.src = this.pet.currentSrc || this.pet.src;
                    portrait.alt = ''; portrait.decoding = 'async';
                    node.appendChild(portrait);
                }
            }
            parent.appendChild(node);
            return node;
        },
        leaves(parent, count, burst = false) {
            const total = this.reduced() ? 0 : Math.min(64, getLuxuryQualityCount(count));
            for (let i = 0; i < total; i++) {
                const leaf = document.createElement('i');
                leaf.className = 'hacmong2-leaf';
                const angle = i / total * Math.PI * 2;
                const radius = 55 + Math.random() * (burst ? 220 : 100);
                leaf.style.cssText = `--x:${Math.random() * 100}%;--size:${8 + Math.random() * 14}px;` +
                    `--duration:${12 + Math.random() * 16}s;--delay:${-Math.random() * 28}s;` +
                    `--drift:${Math.random() * 200 - 100}px;--turn:${Math.random() * 360}deg;` +
                    `--dx:${Math.cos(angle) * radius}px;--dy:${Math.sin(angle) * radius}px;` +
                    `--leaf-color:${['#b4e4df', '#f4fcfa', '#d6c695', '#6eaaa7'][i % 4]};`;
                parent.appendChild(leaf);
            }
        },
        // Decorative geometry is generated once per mount; CSS animates the layers.
        craneMarkup() { return '<svg viewBox="0 0 260 140" aria-hidden="true"><g fill="currentColor"><path d="M127 75C95 58 65 15 4 10C45 28 62 61 109 88C71 78 57 80 37 87C81 109 120 101 143 91C155 82 158 68 153 54C147 38 163 29 177 40L185 42L180 32C156 15 133 31 139 54C143 66 137 72 127 75Z"/><path d="M139 77C170 45 202 18 254 27C216 42 199 74 155 90Z"/></g><path d="M159 88L215 123M149 91L193 135" stroke="currentColor" stroke-width="2" fill="none"/><path d="M167 31L174 34" stroke="#b96752" stroke-width="4"/></svg>'; },
        branchMarkup() {
            const leaves = Array.from({ length: 9 }, (_, i) => {
                const x = 30 + i * 28, y = 110 - i * 9;
                return `<g transform="translate(${x} ${y}) rotate(-18)">
                    <path opacity=".85" d="M0 0C-12-4-21-17-16-29C-3-26 4-12 0 0Z"/>
                    <path opacity=".65" d="M0 0C10 2 22-3 25-15C12-19 2-10 0 0Z"/>
                    <path d="M-13-24L0 0L21-12" fill="none" stroke="#ffe5a8" stroke-width=".8" opacity=".8"/></g>`;
            }).join('');
            return `<svg viewBox="0 0 300 150" fill="currentColor" aria-hidden="true"><path d="M5 119Q150 78 285 28" fill="none" stroke="currentColor" stroke-width="1.5"/>${leaves}</svg>`;
        },
        motes(parent, count, orbit = false) {
            const total = this.reduced() ? 0 : Math.min(40, getLuxuryQualityCount(count));
            for (let i = 0; i < total; i++) {
                const mote = document.createElement('i');
                mote.className = orbit ? 'hacmong2b-orbit-mote' : 'hacmong2b-mote';
                mote.style.cssText = `--mx:${Math.random() * 100}%;--my:${Math.random() * 100}%;` +
                    `--angle:${i * 360 / total}deg;--speed:${8 + Math.random() * 12}s;` +
                    `--wait:${-Math.random() * 20}s;--radius:${65 + Math.random() * 30}px;`;
                parent.appendChild(mote);
            }
        },
        createWorld() {
            const world = this.layer('hacmong2-world hacmong2b-world', `
                <div class="hacmong2-horizon"></div>
                <div class="hacmong2-mountains"><i></i><i></i><i></i></div>
                <div class="hacmong2-cloud cloud-one"></div><div class="hacmong2-cloud cloud-two"></div>
                <div class="hacmong2-cranes"><span>${this.craneMarkup()}</span><span>${this.craneMarkup()}</span><span>${this.craneMarkup()}</span></div><div class="hacmong2-rays"></div>
                <div class="hacmong2b-sun-disc"><i></i><i></i></div>
                <div class="hacmong2b-silk silk-a"></div><div class="hacmong2b-silk silk-b"></div>
                <div class="hacmong2b-canopy canopy-left">${this.branchMarkup()}</div>
                <div class="hacmong2b-canopy canopy-right">${this.branchMarkup()}</div>
                <div class="hacmong2b-fall fall-far"></div><div class="hacmong2b-fall fall-near"></div>
                <div class="hacmong2b-fireflies"></div><div class="hacmong2b-ground-glow"></div>`);
            const mobile = window.innerWidth < 600;
            this.leaves(world.querySelector('.fall-far'), mobile ? 9 : 18);
            this.leaves(world.querySelector('.fall-near'), mobile ? 7 : 14);
            this.motes(world.querySelector('.hacmong2b-fireflies'), mobile ? 12 : 28);
            this.layer('hacmong2-frame hacmong2b-frame', `<i></i><i></i><i></i><span class="hacmong2b-border-vine vine-left">${this.branchMarkup()}</span><span class="hacmong2b-border-vine vine-right">${this.branchMarkup()}</span>`);
        },
        createRealm(container) {
            const realm = this.layer('hacmong2-realm hacmong2b-realm', `
                <span class="hacmong2-pet-halo"></span>
                <div class="hacmong2b-astrolabe"><i class="ring-outer"></i><i class="ring-inner"></i>
                    <span class="hacmong2b-runes">✧ · ◇ · ✦ · ◇ · ✧</span></div>
                <div class="hacmong2b-laurel laurel-left">${this.branchMarkup()}</div>
                <div class="hacmong2b-laurel laurel-right">${this.branchMarkup()}</div>
                <div class="hacmong2b-pendants"><i></i><i></i><i></i><i></i></div>
                <div class="hacmong2b-orbit-field"></div>
                <div class="hacmong2b-pet-dust"></div>
                <div class="hacmong2b-pedestal"><i></i><i></i><i></i></div>
                <span class="hacmong2-pet-sigil">✧</span>`, container);
            this.motes(realm.querySelector('.hacmong2b-orbit-field'), 12, true);
            this.motes(realm.querySelector('.hacmong2b-pet-dust'), 14);
            const front = this.layer('hacmong2b-realm-front', '<div class="hacmong2b-foot-leaves"></div><span class="hacmong2b-comet"></span>', container);
            this.leaves(front.querySelector('.hacmong2b-foot-leaves'), 8);
        },

        clickBurst(x,y) {if(!document.documentElement.classList.contains('hacmong2-equipped'))return;return luxuryTapBloom11(this,'hacmong',x,y);
        },
        createUltimate() {
            if (!this.pet?.isConnected || this.locked || document.hidden ||
                this.container?.dataset.petDragged === '1') return;
            this.locked = true;
            this.container.classList.add('hacmong2-casting');
            const ultimate = this.layer('hacmong2-ultimate', `
                <div class="hacmong2-veil"></div><div class="hacmong2-aurora"></div>
                <div class="hacmong2-equinox"><i></i><i></i><i></i><span>✦</span></div>
                <div class="hacmong2-ultimate-leaves"></div>
                <div class="hacmong2-heaven-gate"><i></i><i></i><i></i></div>
                <div class="hacmong2-ultimate-cranes"><span>${this.craneMarkup()}</span><span>${this.craneMarkup()}</span></div>
                <div class="hacmong2b-ultimate-wreath wreath-left">${this.branchMarkup()}</div>
                <div class="hacmong2b-ultimate-wreath wreath-right">${this.branchMarkup()}</div>
                <div class="hacmong2b-ultimate-halo"><i></i><i></i></div>
                <div class="hacmong2b-ultimate-dust"></div>
                <div class="hacmong2-caption"><small>HẠC MỘNG THỨC TỈNH</small>
                    <strong>Thiên Hạc Quy Vân</strong><span>Cánh hạc qua mây · Một thoáng tiên cảnh</span></div>`);
            this.leaves(ultimate.querySelector('.hacmong2-ultimate-leaves'), 48, true);
            this.motes(ultimate.querySelector('.hacmong2b-ultimate-dust'), 32);
            const duration = this.reduced() ? 1100 : 8200;
            this.later(() => ultimate.classList.add('is-ending'), duration - 600);
            this.later(() => {
                ultimate.remove();
                this.container?.classList.remove('hacmong2-casting');
            }, duration);
            this.later(() => { this.locked = false; }, this.reduced() ? 1800 : 9200);
        },
        mount() {
            if (window.isStudentStoreGameAccessEnabled?.() === false || window.isExamVisualItemsSuspended || window.currentActiveExamId) return;
            if (typeof myInventory !== 'undefined' && Array.isArray(myInventory) && !myInventory.some(i =>
                i?.id === HAC_MONG_PREMIUM_PET.id && i.isEquipped === true &&
                (i.isTrial !== true || Number(i.trialExpiry) > Date.now()))) return;
            const pet = document.querySelector('#virtual-pet-img.hacmong2-pet-magic');
            const container = pet?.closest('#virtual-pet-container');
            if (!pet || !container || container.hidden || container.style.display === 'none') return;
            this.clear();
            ensureHacMongStylesheet();
            this.pet = pet;
            this.container = container;
            this.controller = new AbortController();
            const { signal } = this.controller;
            document.documentElement.classList.add('hacmong2-equipped');
            container.classList.add('hacmong2-pet-stage');
            this.createWorld();
            this.createRealm(container);
            this.originalAttributes = Object.fromEntries(['tabindex', 'role', 'aria-label', 'title'].map(name => [name, pet.getAttribute(name)]));
            pet.setAttribute('tabindex', '0');
            pet.setAttribute('role', 'button');
            pet.setAttribute('aria-label', 'Hạc Mộng: kích hoạt Thiên Hạc Quy Vân');
            pet.title = 'Nhấn để thi triển Thiên Hạc Quy Vân';
            pet.addEventListener('click', () => this.createUltimate(), { signal });
            pet.addEventListener('keydown', event => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    container.dataset.petDragged = '0';
                    this.createUltimate();
                }
            }, { signal });
            installLuxuryGestures10(this,'hacmong','hacmong2-equipped',(x,y)=>this.clickBurst(x,y));;
            document.addEventListener('visibilitychange', () => {
                document.documentElement.classList.toggle('hacmong2-paused', document.hidden);
            }, { signal });
            // Local observation catches close, unequip, replacement and remote inventory removal.
            this.observer = new MutationObserver(() => {
                if (!pet.isConnected || !pet.classList.contains('hacmong2-pet-magic') ||
                    container.hidden || container.style.display === 'none' ||
                    container.style.visibility === 'hidden') this.clear();
            });
            this.observer.observe(container, { childList: true, attributes: true, attributeFilter: ['style', 'hidden', 'class'] });
            this.observer.observe(pet, { attributes: true, attributeFilter: ['class'] });
        },
        restore() {
            if (document.querySelector('#virtual-pet-img.hacmong2-pet-magic')) this.mount();
        }
    };



    const NATIONAL_DAY_PREMIUM_PET = {
        id: 'pet_quoc_khanh_1',

        name: '🇻🇳 Việt Diệu · Hồn Thiêng Độc Lập',

        type: 'pet',

        // Không bán bằng Coin
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'lich_su_hao_hung',
        eventRewardTier: 'luxury',
        eventScoreRequired: 10,

        tag: 'Quốc khánh',
        tags: [
            'Quốc khánh',
            '2/9',
            'Lịch sử hào hùng',
            'Premium',
            'Sự kiện'
        ],

        image:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        asset:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        value:
            'assets/Premium/quốc khánh/nhan-vat-quoc-khanh1.png',

        luxuryTagImage:
            'assets/Premium/quốc khánh/tag.png',

        isIcon: false,

        /*
         * Bộ hiệu ứng riêng:
         * trống đồng Đông Sơn + sơn son đỏ + quầng sao vàng.
         * Không tái sử dụng runtime / class / keyframe của vật phẩm cũ.
         */
        petEffect: 'national-day-chibi-star-magic',
        premiumSuite: 'national-day-heritage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'ultimate'
        ],

        // Pet có kỹ năng nhấn riêng, không dùng click effect mặc định.
        disableClickEffect: true
    };

    // ========================================================
    // QUỐC KHÁNH · LUXURY RUNTIME V2
    // WORLD + INTERFACE
    // Pet realm + click skill vẫn do PetManager quản lý.
    // ========================================================
    const LuxuryNationalDayRuntime = {
        timers:new Set(), sceneLocked10:false,
        design10(){return LUX_CONFIG10.viet;},
        setTimer(fn,ms){const t=setTimeout(()=>{this.timers.delete(t);fn();},ms);this.timers.add(t);return t;},
        getPet(){return document.querySelector('#virtual-pet-img.national-day-chibi-star-magic');},
        clear(){clearLuxuryScene10(this);this.timers.forEach(clearTimeout);this.timers.clear();document.documentElement.classList.remove('national-day-luxury-equipped');this.activePetElement?.classList.remove('national-day-pet-v14');document.getElementById('virtual-pet-container')?.classList.remove('pet-national-day-stage-v14');this.activePetElement=null;},
        createWorld(){document.querySelectorAll('.national-day-world-v4').forEach(n=>n.remove());document.documentElement.classList.add('lux10-viet-equipped');luxuryScene10(this,'world').classList.add('national-day-world-v4');},
        createInterface(){const n=document.createElement('div');n.className='lux10-interface lux10-viet national-day-interface-v4';n.dataset.scene10='viet';n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b>';document.body.appendChild(n);},
        createPetRealm(){return luxuryPet10(this);},
        installPetSkill(){return luxuryPet10(this);},
        createScreenBurst(x,y){return this.createPageClick(x,y);},
        createPageClick(x,y){if(!document.documentElement.classList.contains('national-day-luxury-equipped'))return;return luxuryTapBloom11(this,'viet',x,y);},
        createUltimate(x,y){return luxuryUltimate10(this,x,y);},
        mount(){this.clear();const pet=this.getPet(),box=pet?.closest('#virtual-pet-container');if(!pet||box.hidden||box.style.display==='none')return false;this.activePetElement=pet;document.documentElement.classList.add('national-day-luxury-equipped');this.createWorld();this.createInterface();this.createPetRealm();installLuxuryGestures10(this,'viet','national-day-luxury-equipped',(x,y)=>this.createPageClick(x,y));return true;},
        restore(){if(this.getPet())return this.mount();return false;}
    };

    const SPRING_PREMIUM_PET = {
        id: 'pet_luxury_mua_xuan',

        name: 'Xuân Thần · Vạn Sinh Hoa Mộng',

        type: 'pet',

        // Không bán bằng Coin
        // Bán bằng Coin
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,

        // Không còn là vật phẩm sự kiện
        eventOnly: false,

        tag: 'Mùa xuân',
        tags: [
            'Mùa xuân',
            'Bốn mùa',
            'Premium'
        ],

        // Ảnh nhân vật
        image:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        asset:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        value:
            'assets/Premium/Bốn mùa/mua-xuan-nhan-vat.png',

        // Ảnh tag riêng trên card
        luxuryTagImage:
            'assets/Premium/Bốn mùa/tag-mua-xuan.png',

        isIcon: false,

        // Bộ hiệu ứng Premium Mùa Xuân
        petEffect: 'premium-spring-goddess-magic',
        premiumSuite: 'spring-crown-court-v3',
        premiumLayers: ['world-effect', 'interface', 'pet-realm'],

        // Không dùng hiệu ứng click thú cưng mặc định
        disableClickEffect: true
    };


    // ========================================================
    // PREMIUM MÙA HẠ · HẠ NHẬT LƯU KIM
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu
    // - Card giữ nguyên bố cục Luxury Store
    // - Tag riêng: assets/Premium/Bốn mùa/ha_tag2.png
    // - Pet riêng: assets/Premium/Bốn mùa/ha_nhan_vat2.png
    // - Full suite độc lập, KHÔNG ghi active_theme / active_effect
    // ========================================================
    const SUMMER_PREMIUM_PET = {
        id: 'pet_luxury_mua_ha',
        name: 'Hạ Thần · Nhật Diệu Lưu Kim',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Mùa hạ',
        tags: [
            'Mùa hạ',
            'Bốn mùa',
            'Premium'
        ],

        image: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',
        asset: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',
        value: 'assets/Premium/Bốn mùa/ha_nhan_vat2.png',

        luxuryTagImage:
            'assets/Premium/Bốn mùa/ha_tag2.png',

        isIcon: false,

        petEffect: 'premium-summer-solstice-magic',
        premiumSuite: 'summer-solstice-golden-mirror-court-v3',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'drag-trail'
        ],

        // Kỹ năng click do LuxurySummerRuntime tự quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // MÙA HẠ · HẠ NHẬT LƯU KIM — FULL WEB RUNTIME
    // Namespace: summer-solstice-* / ssv2-* / ssv3-*
    // Không gọi ThemeManager / EffectManager nên không chiếm
    // active_theme / active_effect và không xóa vật phẩm khác.
    // ========================================================
    const LuxurySummerRuntime = {
        timers:new Set(), sceneLocked10:false,
        design10(){return LUX_CONFIG10.summer;},
        setTimer(fn,ms){const t=setTimeout(()=>{this.timers.delete(t);fn();},ms);this.timers.add(t);return t;},
        getPet(){return document.querySelector('#virtual-pet-img.premium-summer-solstice-magic');},
        clear(){clearLuxuryScene10(this);this.timers.forEach(clearTimeout);this.timers.clear();document.documentElement.classList.remove('summer-solstice-equipped');this.activePetElement?.classList.remove('summer-solstice-pet');document.getElementById('virtual-pet-container')?.classList.remove('pet-summer-solstice-stage');this.activePetElement=null;},
        createWorld(){document.querySelectorAll('.summer-solstice-world').forEach(n=>n.remove());document.documentElement.classList.add('lux10-summer-equipped');luxuryScene10(this,'world').classList.add('summer-solstice-world');},
        createInterface(){const n=document.createElement('div');n.className='lux10-interface lux10-summer summer-solstice-ui-frame';n.dataset.scene10='summer';n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b>';document.body.appendChild(n);},
        createPetRealm(){return luxuryPet10(this);},
        installPetSkill(){return luxuryPet10(this);},
        createScreenBurst(x,y){return this.createPageClick(x,y);},
        createPageClick(x,y){if(!document.documentElement.classList.contains('summer-solstice-equipped'))return;return luxuryTapBloom11(this,'summer',x,y);},
        createUltimate(x,y){return luxuryUltimate10(this,x,y);},
        mount(){this.clear();const pet=this.getPet(),box=pet?.closest('#virtual-pet-container');if(!pet||box.hidden||box.style.display==='none')return false;this.activePetElement=pet;document.documentElement.classList.add('summer-solstice-equipped');this.createWorld();this.createInterface();this.createPetRealm();installLuxuryGestures10(this,'summer','summer-solstice-equipped',(x,y)=>this.createPageClick(x,y));return true;},
        restore(){if(this.getPet())return this.mount();return false;}
    };



    // ========================================================
    // NYX · HẮC DẠ NGUYÊN SƠ — THẦN THOẠI
    // - Bán 12.000 Coin
    // - Card + tag riêng, khóa theo data-item-id
    // - Chỉ là thú cưng; không tự bật theme/effect giao diện khác
    // ========================================================
    const MYTHIC_NYX_PET = {
        id: 'pet_mythic_nyx_1',
        name: 'NYX · Vĩnh Dạ Tinh Thần',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Thần thoại',
        tags: [
            'Thần thoại',
            'Nyx',
            'Nữ thần màn đêm',
            'Premium'
        ],

        image: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        asset: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        value: 'assets/Premium/Thần thoại/nyx-nhanvat1.png',
        luxuryTagImage:
            'assets/Premium/Thần thoại/nyx-tag1.png',
        isIcon: false,

        // Namespace hiệu ứng mới, không tái sử dụng pet cũ.
        petEffect: 'mythic-nyx-night-magic',
        premiumSuite: 'nyx-first-night-v2',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // AETHER · THIÊN QUANG NGUYÊN SƠ — THẦN THOẠI
    // - Bán 15.000 Coin
    // - Card riêng nhưng giữ nguyên bố cục Luxury chuẩn
    // - Tag ảnh: assets/Premium/Thần thoại/aether-tag2.png
    // - Full suite độc lập, không ghi đè active_theme / active_effect
    // - MỘT CSS: css/aether-than-thoai.css?v=20260927.five-realms-v9
    // ========================================================
    const MYTHIC_AETHER_PET = {
        id: 'pet_mythic_aether_1',
        name: 'AETHER · Thiên Quang Nguyên Sơ',
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Thần thoại',
        tags: [
            'Thần thoại',
            'Aether',
            'Thiên quang',
            'Premium'
        ],

        image: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        asset: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        value: 'assets/Premium/Thần thoại/aether-nhan-vat2.png',
        luxuryTagImage:
            'assets/Premium/Thần thoại/aether-tag2.png',
        isIcon: false,

        // Chỉ dùng class riêng của Aether; PetManager generic sẽ gắn class này.
        petEffect: 'mythic-aether-luminous-magic',
        premiumSuite: 'aether-luminous-heaven-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],

        // Click được LuxuryAetherRuntime quản lý hoàn toàn.
        disableClickEffect: true
    };




    // ========================================================
    // ĐÊM ĐẦY SAO · VAN GOGH INSPIRED — PREMIUM PET
    // - Bán 15.000 Coin
    // - Tag ảnh: assets/Premium/đêm đầy sao/tag.png
    // - Nhân vật: assets/Premium/đêm đầy sao/nam_nham_vat1.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury chuẩn
    // - Full-web suite độc lập; không ghi đè active_theme / active_effect
    // - MỘT CSS: css/dem-day-sao.css?v=20260927.five-realms-v9
    // ========================================================
    const STARRY_NIGHT_PREMIUM_PET = {
        id: 'pet_dem_day_sao_1',
        name: 'Tinh Dạ · Lữ Khách Đêm Sao',
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Đêm đầy sao',
        tags: [
            'Đêm đầy sao',
            'Van Gogh',
            'Tinh dạ',
            'Premium'
        ],

        image: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        asset: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        value: 'assets/Premium/đêm đầy sao/nam_nham_vat1.png',
        luxuryTagImage: 'assets/Premium/đêm đầy sao/tag.png',
        isIcon: false,

        petEffect: 'starry-night-van-gogh-magic',
        premiumSuite: 'starry-night-canvas-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN MORETTI — EVENT PREMIUM PET
    // - KHÔNG bán bằng Coin.
    // - Chỉ nhận từ sự kiện Lord of the Mysteries.
    // - Tag: assets/Premium/quỷ bí/tag1.png
    // - Nhân vật: assets/Premium/quỷ bí/klain_nha-vat.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury Store.
    // - Full suite độc lập; không ghi đè active_theme / active_effect.
    // - MỘT CSS: css/lord-of-mysteries-klein.css?v=20260927.five-realms-v9
    // ========================================================
    const LOTM_KLEIN_EVENT_PET = {
        id: 'pet_lotm_klein_event_1',
        name: 'Klein Moretti · Quỷ Bí Chi Chủ',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'lord_of_the_mysteries_event',
        eventRewardTier: 'premium',

        tag: 'Lord of the Mysteries',
        tags: [
            'Lord of the Mysteries',
            'Quỷ Bí Chi Chủ',
            'Klein Moretti',
            'Premium',
            'Sự kiện'
        ],

        image: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        asset: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        value: 'assets/Premium/quỷ bí/klain_nha-vat.png',
        luxuryTagImage: 'assets/Premium/quỷ bí/tag1.png',
        isIcon: false,

        petEffect: 'lotm-klein-mystery-magic',
        premiumSuite: 'lotm-klein-sefirah-castle-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };


    // ========================================================
    // CẦM CƠ · CẦM MỘNG — TU TIÊN PREMIUM
    // - Bán 12.000 Coin
    // - Tag ảnh: assets/Premium/Tu tiên/cam_co_tag1.png
    // - Nhân vật: assets/Premium/Tu tiên/cam_co_nhan_vat1.png
    // - Card riêng nhưng GIỮ NGUYÊN bố cục Luxury Store.
    // - Full suite độc lập; không ghi đè active_theme / active_effect.
    // ========================================================
    const CAM_CO_CAM_MONG_PET = {
        id: 'pet_cam_co_cam_mong_1',
        name: 'Lạc Thanh Huyền',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Cầm Mộng',
        tags: [
            'Cầm Mộng',
            'Cầm Cơ',
            'Tu tiên',
            'Premium'
        ],

        image: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        asset: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        value: 'assets/Premium/Tu tiên/cam_co_nhan_vat1.png',
        luxuryTagImage: 'assets/Premium/Tu tiên/cam_co_tag1.png',
        isIcon: false,

        petEffect: 'cam-co-cam-mong-qin-dream-magic',
        premiumSuite: 'cam-co-cam-mong-palace-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // TAMON'S B-SIDE · PREMIUM PET
    // - Bán 15.000 Coin
    // - Tag ảnh: assets/Premium/Tamon/tamon-tag1.png
    // - Nhân vật: assets/Premium/Tamon/tamon-nhan-vat1.png
    // - Card giữ đúng bố cục Luxury hiện có nhưng có skin riêng.
    // - Full suite độc lập; KHÔNG dùng ThemeManager/EffectManager.
    // ========================================================
    const TAMON_BSIDE_PET = {
        id: 'pet_tamon_b_side_1',
        name: "Tamon · Bóng Hồng Ngạo Nghễ  ",
        type: 'pet',
        price: 15000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: "Tamon's B-Side",
        tags: [
            "Tamon's B-Side",
            'Tamon',
            'B-Side',
            'Premium'
        ],

        image: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        asset: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        value: 'assets/Premium/Tamon/tamon-nhan-vat1.png',
        luxuryTagImage: 'assets/Premium/Tamon/tamon-tag1.png',
        isIcon: false,

        petEffect: 'tamon-b-side-soundwave-magic',
        premiumSuite: 'tamon-b-side-stage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };


    // ========================================================
    // TAMON'S B-SIDE · PINK STATIC · PREMIUM PET #2
    // - KHÔNG bán bằng Coin
    // - Nhận từ sự kiện
    // - Tag: assets/Premium/Tamon/tamon-tag1.png
    // - Nhân vật: assets/Premium/Tamon/tamon-nhan-vat2.png
    // - Full suite hoàn toàn mới; không tái sử dụng hiệu ứng pet 1.
    // - Dùng CHUNG file css/tamon-b-side.css.
    // ========================================================
    const TAMON_PINKSTATIC_PET = {
        id: 'pet_tamon_b_side_2',
        name: 'Tamon · Hắc Miêu Thiếu Niên  ',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        luxuryOnly: true,
        eventOnly: true,

        eventId: 'tamon_b_side_event',
        eventRewardTier: 'luxury',
        eventScoreRequired: 10,

        tag: "Tamon's B-Side",
        tags: [
            "Tamon's B-Side",
            'Tamon',
            'B-Side',
            'Pink Static',
            'Premium',
            'Sự kiện'
        ],

        image: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        asset: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        value: 'assets/Premium/Tamon/tamon-nhan-vat2.png',
        luxuryTagImage: 'assets/Premium/Tamon/tamon-tag1.png',
        isIcon: false,

        petEffect: 'tamon-pink-static-magic',
        premiumSuite: 'tamon-pink-static-stage-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'ultimate'
        ],
        disableClickEffect: true
    };



    // ========================================================
    // TRUNG THU · NGUYỆT CUNG TIÊN TỬ — PREMIUM PET
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu
    // - Nhân vật: assets/Premium/Trung thu/hang_nhan_vat1.png
    // - Tag: assets/Premium/Trung thu/tag1.png
    // - Card riêng nhưng giữ đúng bố cục Luxury Store hiện hành.
    // - Full suite độc lập, KHÔNG chiếm active_theme / active_effect.
    // ========================================================
    const MID_AUTUMN_MOON_PET = {
        id: 'pet_trung_thu_nguyet_cung_tien_tu',
        name: 'Nguyệt Cung Tiên Tử',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        midAutumnCoinPrice: 2,
        currency: 'mid_autumn_coin',
        luxuryOnly: true,
        eventOnly: true,

        tag: 'Trung thu',
        tags: [
            'Trung thu',
            'Nguyệt cung',
            'Cổ tích',
            'Premium'
        ],

        image: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        asset: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        value: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
        luxuryTagImage: 'assets/Premium/Trung thu/tag1.png',
        isIcon: false,

        petEffect: 'midautumn-moon-palace-pet-magic',
        premiumSuite: 'midautumn-moon-palace-fairytale-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        // Click của pet do LuxuryMidAutumnRuntime quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // TRUNG THU · CHÚ CUỘI — PREMIUM PET #2
    // - Đổi bằng 2 Xu Trung Thu đúng ngày Trung Thu.
    // - Nhân vật: assets/Premium/Trung thu/cuoi_nhan_vat2.png
    // - Dùng CHUNG ảnh tag Trung Thu với Nguyệt Cung Tiên Tử.
    // - Card riêng nhưng giữ nguyên bố cục Luxury Store.
    // - Full suite dùng runtime Trung Thu độc lập, có biến thể Cuội;
    //   KHÔNG chiếm active_theme / active_effect.
    // ========================================================
    const MID_AUTUMN_CUOI_PET = {
        id: 'pet_trung_thu_chu_cuoi_2',
        name: 'Chú Cuội · Nguyệt Quế Tiên Đồng',
        type: 'pet',
        price: 0,
        isNonCoin: true,
        midAutumnCoinPrice: 2,
        currency: 'mid_autumn_coin',
        luxuryOnly: true,
        eventOnly: true,

        tag: 'Trung thu',
        tags: [
            'Trung thu',
            'Chú Cuội',
            'Nguyệt quế',
            'Premium'
        ],

        image: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
        asset: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
        value: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',

        // CÙNG TAG với Nguyệt Cung Tiên Tử.
        luxuryTagImage: 'assets/Premium/Trung thu/tag1.png',
        isIcon: false,

        petEffect: 'midautumn-cuoi-moonwood-magic',
        premiumSuite: 'midautumn-cuoi-moonwood-fairytale-v1',
        premiumLayers: [
            'world-effect',
            'interface',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        disableClickEffect: true
    };



    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — PREMIUM PET
    // - Bán 12.000 Coin.
    // - Tag ảnh: assets/Premium/Lock/tag1.png
    // - Nhân vật: assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png
    // - Card riêng nhưng giữ nguyên cấu trúc/bố cục Luxury Store.
    // - Full suite độc lập; KHÔNG ghi đè active_theme / active_effect.
    // ========================================================
    const LINKCLICK_CHENG_XIAOSHI_PET = {
        id: 'pet_linkclick_cheng_xiaoshi_1',
        name: 'Cheng Xiaoshi · Thời Quang Ảnh Giới',
        type: 'pet',
        price: 12000,
        isNonCoin: false,
        luxuryOnly: true,
        eventOnly: false,

        tag: 'Link Click',
        tags: [
            'Link Click',
            'Cheng Xiaoshi',
            'Thời Quang',
            'Premium'
        ],

        image: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        asset: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        value: 'assets/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png',
        luxuryTagImage: 'assets/Premium/Lock/tag1.png',
        isIcon: false,

        petEffect: 'linkclick-cheng-timeframe-magic',
        premiumSuite: 'linkclick-cheng-timeframe-v2-cinematic',
        premiumLayers: [
            'world-effect',
            'interface',
            'cinematic-hud',
            'time-memory-world',
            'pet-realm',
            'global-click',
            'pet-skill',
            'ultimate'
        ],

        // Click pet do LuxuryLinkClickChengRuntime quản lý.
        disableClickEffect: true
    };


    // ========================================================
    // TRUNG THU · NGUYỆT CUNG — CSS LOADER
    // CHỈ MỘT file CSS đảm nhiệm toàn bộ:
    // card + pet realm + full-web skin + popup/input/slider/scrollbar
    // + click effect + fullscreen ultimate.
    // ========================================================
    function ensureMidAutumnStylesheet() {
        if (document.getElementById('midautumn-moon-palace-premium-style')) {
            return;
        }

        let href = '';

        if (window.MID_AUTUMN_MOON_CSS_PATH) {
            href = String(window.MID_AUTUMN_MOON_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/trung-thu-nguyet-cung.css?v=20260927.realms10', ownScript.src).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/trung-thu-nguyet-cung.css?v=20260927.realms10', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'midautumn-moon-palace-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.midAutumnMoonPalace = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Trung thu] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/trung-thu-nguyet-cung.css hoặc gán window.MID_AUTUMN_MOON_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // TRUNG THU · NGUYỆT CUNG — FULL PREMIUM RUNTIME V1
    // Namespace: midautumn-* / ma-*
    // KHÔNG gọi ThemeManager / EffectManager.
    // Runtime sống cùng pet; gỡ/đổi pet là dọn sạch toàn bộ.
    // ========================================================
    const LuxuryMidAutumnRuntime = {
        design10() { return LUX_CONFIG10[this.variant==='cuoi'?'cuoi':'moon']; },
        sceneLocked10: false, lastTap10: -1000,
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),
        variant: 'moon',

        detectVariant() {
            const activePetId =
                String(localStorage.getItem('active_pet') || '');

            const pet =
                document.querySelector(
                    '#virtual-pet-container #virtual-pet-img'
                );

            const src =
                String(pet?.getAttribute('src') || '');

            if (
                activePetId === MID_AUTUMN_CUOI_PET.id ||
                pet?.classList.contains('midautumn-cuoi-moonwood-magic') ||
                src.includes('/Trung thu/cuoi_nhan_vat2.png')
            ) {
                return 'cuoi';
            }

            return 'moon';
        },

        getVariantConfig() {
            if (this.variant === 'cuoi') {
                return {
                    rootClass: 'midautumn-cuoi-equipped',
                    bodyClass: 'theme-midautumn-cuoi',
                    stageClass: 'pet-midautumn-cuoi-stage',
                    petClass: 'midautumn-cuoi-pet',
                    image: 'assets/Premium/Trung thu/cuoi_nhan_vat2.png',
                    sealSmall: '中 秋 · 桂 影',
                    sealTitle: 'NGUYỆT QUẾ',
                    sealSubtitle: 'TRĂNG RẰM · CÂY QUẾ · CỔ TÍCH',
                    bottomTitle: 'CHÚ CUỘI · NGUYỆT QUẾ TIÊN ĐỒNG',
                    clickSeal: '桂',
                    glyphs: ['桂', '月', '童'],
                    ultimateSmall: '桂 影 入 梦 · 月 满 人 间',
                    ultimateTitle: 'NGUYỆT QUẾ TIÊN CẢNH',
                    ultimateSubtitle: 'CUỘI KHAI QUẾ ẢNH · VẠN ĐĂNG ĐỒNG MINH',
                    dialogueSmall: 'TRUNG THU · NGUYỆT QUẾ KHAI CẢNH',
                    dialogueTitle: 'CHÚ CUỘI · NGUYỆT QUẾ TIÊN ĐỒNG',
                    dialogueSubtitle: 'QUẾ ẢNH PHÙ QUANG · TRĂNG RẰM ĐOÀN VIÊN'
                };
            }

            return {
                rootClass: '',
                bodyClass: '',
                stageClass: 'pet-midautumn-moon-palace-stage',
                petClass: 'midautumn-moon-palace-pet',
                image: 'assets/Premium/Trung thu/hang_nhan_vat1.png',
                sealSmall: '中 秋 · 月 宫',
                sealTitle: 'NGUYỆT CUNG',
                sealSubtitle: 'TRĂNG RẰM · CỔ TÍCH · ĐOÀN VIÊN',
                bottomTitle: 'NGUYỆT CUNG TIÊN TỬ',
                clickSeal: '月',
                glyphs: ['桂', '宫', '兔'],
                ultimateSmall: '桂 香 入 梦 · 月 满 人 间',
                ultimateTitle: 'NGUYỆT CUNG TIÊN CẢNH',
                ultimateSubtitle: 'TRĂNG RẰM KHAI CẢNH · VẠN ĐĂNG ĐỒNG MINH',
                dialogueSmall: 'TRUNG THU · NGUYỆT CUNG KHAI CẢNH',
                dialogueTitle: 'NGUYỆT CUNG TIÊN TỬ',
                dialogueSubtitle: 'QUẾ HƯƠNG NHẬP MỘNG · VẠN ĐĂNG ĐOÀN VIÊN'
            };
        },

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.midautumn-moon-palace-pet,' +
                '#virtual-pet-container #virtual-pet-img.midautumn-cuoi-pet'
            );
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryScene10(this);
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'midautumn-moon-palace-equipped',
                'midautumn-moon-palace-skill-active',
                'midautumn-cuoi-equipped'
            );
            document.body?.classList.remove(
                'theme-midautumn-moon-palace',
                'theme-midautumn-cuoi'
            );

            document
                .querySelectorAll(
                    '.midautumn-world,' +
                    '.midautumn-ui-frame,' +
                    '.midautumn-page-click,' +
                    '.midautumn-ultimate,' +
                    '.midautumn-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-midautumn-moon-palace-stage',
                'pet-midautumn-cuoi-stage',
                'midautumn-pet-casting'
            );

            container
                ?.querySelectorAll('.midautumn-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove(
                    'midautumn-moon-palace-pet',
                    'midautumn-cuoi-pet'
                );
        },

        createWorld() {const c=this.design10();document.querySelectorAll('.'+c.world).forEach(n=>n.remove());document.documentElement.classList.add('lux10-'+c.id+'-equipped');luxuryScene10(this,'world').classList.add(c.world);
        },

        createInterface() {const c=this.design10();document.querySelectorAll('.'+c.ui).forEach(n=>n.remove());const n=document.createElement('div');n.className='lux10-interface lux10-'+c.id+' '+c.ui;n.dataset.scene10=c.id;n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b><em></em>';document.body.appendChild(n);
        },

        createPetRealm() {return luxuryPet10(this);
        },

        installPetSkill() {return luxuryPet10(this);
        },

        installGlobalClick() {const c=this.design10();installLuxuryGestures10(this,c.id,c.root,(x,y)=>this.createPageClick(x,y));
        },

        createPageClick(x,y) {const c=this.design10();if(!document.documentElement.classList.contains(c.root))return;return luxuryTapBloom11(this,c.id,x,y);
        },

        createUltimate(x,y) {return luxuryUltimate10(this,x,y);
        },

        installObserver() {
            if (this.observer) {
                this.observer.disconnect();
            }

            const container =
                document.getElementById('virtual-pet-container');
            if (!container) return;

            this.observer = new MutationObserver(() => {
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;

                const pet = this.getPet();
                const style = window.getComputedStyle(container);
                const visible =
                    style.display !== 'none' &&
                    style.visibility !== 'hidden';

                if (!pet || !visible) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        },

        mount() {
            const nextVariant = this.detectVariant();

            this.clear();
            this.variant = nextVariant;
            ensureMidAutumnStylesheet();

            const variant =
                this.getVariantConfig();

            document.documentElement.classList.add(
                'midautumn-moon-palace-equipped'
            );

            if (variant.rootClass) {
                document.documentElement.classList.add(
                    variant.rootClass
                );
            }

            document.body?.classList.add(
                'theme-midautumn-moon-palace'
            );

            if (variant.bodyClass) {
                document.body?.classList.add(
                    variant.bodyClass
                );
            }

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installObserver();

            const repairMount = () => {
                if (!document.documentElement.classList.contains('midautumn-moon-palace-equipped')) return;

                if (!document.querySelector('.midautumn-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.midautumn-ui-frame')) {
                    this.createInterface();
                }

                const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
                if (
                    pet &&
                    !document.querySelector('#virtual-pet-container .midautumn-pet-realm')
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        },

        restore(attempt = 0) {
            ensureMidAutumnStylesheet();

            const activePetId =
                String(localStorage.getItem('active_pet') || '');
            const pet =
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            const looksActive =
                activePetId === MID_AUTUMN_MOON_PET.id ||
                activePetId === MID_AUTUMN_CUOI_PET.id ||
                pet?.classList.contains('midautumn-moon-palace-pet-magic') ||
                pet?.classList.contains('midautumn-cuoi-moonwood-magic') ||
                String(pet?.getAttribute('src') || '').includes('/Trung thu/hang_nhan_vat1.png') ||
                String(pet?.getAttribute('src') || '').includes('/Trung thu/cuoi_nhan_vat2.png');

            if (!looksActive) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 8) {
                this.setTimer(() => this.restore(attempt + 1), 180 + attempt * 70);
            }

            return false;
        }
    };



    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — CSS LOADER
    // MỘT file CSS đảm nhiệm: card + full-web skin + popup/form/
    // slider/scrollbar + pet realm + click + ultimate.
    // ========================================================
    function ensureLinkClickChengStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)link-click-cheng-xiaoshi(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'linkclick-cheng-premium-style';
            return;
        }

        if (document.getElementById('linkclick-cheng-premium-style')) {
            return;
        }

        let href = '';

        if (window.LINKCLICK_CHENG_CSS_PATH) {
            href = String(window.LINKCLICK_CHENG_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/link-click-cheng-xiaoshi.css?v=20260927.realms10',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/link-click-cheng-xiaoshi.css?v=20260927.realms10',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'linkclick-cheng-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.linkClickCheng = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Link Click] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/link-click-cheng-xiaoshi.css hoặc gán window.LINKCLICK_CHENG_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — FULL PREMIUM RUNTIME V2 · CINEMATIC
    // Namespace độc lập: lcx-* / linkclick-cheng-*
    // KHÔNG gọi ThemeManager / EffectManager.
    // ========================================================
    const LuxuryLinkClickChengRuntime = {
        design10() { return LUX_CONFIG10["cheng"]; },
        sceneLocked10: false, lastTap10: -1000,
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        pointerMoveHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.lcx-cheng-pet'
            );
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryScene10(this);
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.pointerMoveHandler) {
                document.removeEventListener(
                    'pointermove',
                    this.pointerMoveHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.pointerMoveHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'linkclick-cheng-equipped',
                'linkclick-cheng-skill-active'
            );

            document.body?.classList.remove(
                'theme-linkclick-cheng'
            );

            document
                .querySelectorAll(
                    '.lcx-world,' +
                    '.lcx-ui-frame,' +
                    '.lcx-page-click,' +
                    '.lcx-ultimate,' +
                    '.lcx-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-linkclick-cheng-stage',
                'linkclick-cheng-casting'
            );

            container
                ?.querySelectorAll('.lcx-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('lcx-cheng-pet');
        },

        createWorld() {const c=this.design10();document.querySelectorAll('.'+c.world).forEach(n=>n.remove());document.documentElement.classList.add('lux10-'+c.id+'-equipped');luxuryScene10(this,'world').classList.add(c.world);
        },

        createInterface() {const c=this.design10();document.querySelectorAll('.'+c.ui).forEach(n=>n.remove());const n=document.createElement('div');n.className='lux10-interface lux10-'+c.id+' '+c.ui;n.dataset.scene10=c.id;n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b><em></em>';document.body.appendChild(n);
        },

        createPetRealm() {return luxuryPet10(this);
        },

        createPageClick(x,y) {const c=this.design10();if(!document.documentElement.classList.contains(c.root))return;return luxuryTapBloom11(this,c.id,x,y);
        },
        installGlobalClick() {const c=this.design10();installLuxuryGestures10(this,c.id,c.root,(x,y)=>this.createPageClick(x,y));
        },

        createUltimate(x,y) {return luxuryUltimate10(this,x,y);
        },

        installObserver() {
            if (this.observer) {
                this.observer.disconnect();
            }

            const container =
                document.getElementById('virtual-pet-container');
            if (!container) return;

            this.observer = new MutationObserver(() => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    )
                ) return;

                const pet = this.getPet();
                const style = window.getComputedStyle(container);
                const visible =
                    style.display !== 'none' &&
                    style.visibility !== 'hidden';

                if (!pet || !visible) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
        },

        mount() {
            this.clear();
            ensureLinkClickChengStylesheet();

            document.documentElement.classList.add(
                'linkclick-cheng-equipped'
            );
            document.body?.classList.add(
                'theme-linkclick-cheng'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installObserver();

            const repairMount = () => {
                if (
                    !document.documentElement.classList.contains(
                        'linkclick-cheng-equipped'
                    )
                ) return;

                if (!document.querySelector('.lcx-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.lcx-ui-frame')) {
                    this.createInterface();
                }
                if (
                    document.querySelector('#virtual-pet-container #virtual-pet-img') &&
                    !document.querySelector('#virtual-pet-container .lcx-pet-realm')
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        },

        restore(attempt = 0) {
            ensureLinkClickChengStylesheet();

            const activePetId =
                String(localStorage.getItem('active_pet') || '');
            const pet =
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            const looksActive =
                activePetId === LINKCLICK_CHENG_XIAOSHI_PET.id ||
                pet?.classList.contains('linkclick-cheng-timeframe-magic') ||
                String(pet?.getAttribute('src') || '').includes(
                    '/Premium/Lock/Cheng Xiaoshi-nhan-vat1.png'
                );

            if (!looksActive) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 8) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    180 + attempt * 70
                );
            }

            return false;
        }
    };


    // ========================================================
    // LINK CLICK · CHENG XIAOSHI — AUTO MOUNT / SELF-HEAL V1.1
    // Bắt cả trường hợp pet được spawn trước khi luxury-store.js cài hook,
    // hoặc reload trang mà active_pet chưa kịp đồng bộ vào localStorage.
    // ========================================================
    let linkClickChengAutoObserver = null;
    let linkClickChengAutoRetryTimer = null;

    function isLinkClickChengPetElement(pet) {
        if (!pet) return false;

        if (
            pet.classList?.contains('linkclick-cheng-timeframe-magic') ||
            pet.classList?.contains('lcx-cheng-pet')
        ) {
            return true;
        }

        let source = String(
            pet.getAttribute?.('src') ||
            pet.src ||
            ''
        );

        try {
            source = decodeURIComponent(source);
        } catch (_) {}

        source = source
            .replace(/\\/g, '/')
            .toLowerCase();

        return (
            source.includes(
                '/premium/lock/cheng xiaoshi-nhan-vat1.png'
            ) ||
            source.endsWith(
                'assets/premium/lock/cheng xiaoshi-nhan-vat1.png'
            )
        );
    }

    function syncLinkClickChengRuntimeFromDom() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const container =
            document.getElementById('virtual-pet-container');

        const pet =
            container?.querySelector('#virtual-pet-img');

        const shouldBeActive =
            isLinkClickChengPetElement(pet);

        const htmlRoot =
            document.documentElement;

        if (shouldBeActive) {
            const healthy =
                htmlRoot.classList.contains(
                    'linkclick-cheng-equipped'
                ) &&
                Boolean(
                    document.querySelector('.lcx-world')
                ) &&
                Boolean(
                    document.querySelector('.lcx-ui-frame')
                ) &&
                Boolean(
                    container?.querySelector('.lcx-pet-realm')
                );

            if (!healthy) {
                try {
                    LuxuryLinkClickChengRuntime.mount();
                } catch (error) {
                    console.error(
                        '[Link Click] Auto-mount Cheng Xiaoshi thất bại:',
                        error
                    );
                }
            }

            return true;
        }

        if (
            htmlRoot.classList.contains(
                'linkclick-cheng-equipped'
            )
        ) {
            LuxuryLinkClickChengRuntime.clear();
        }

        return false;
    }

    function installLinkClickChengAutoMountObserver(
        attempt = 0
    ) {
        const container =
            document.getElementById('virtual-pet-container');

        if (!container) {
            if (attempt < 80) {
                window.clearTimeout(
                    linkClickChengAutoRetryTimer
                );

                linkClickChengAutoRetryTimer =
                    window.setTimeout(
                        () =>
                            installLinkClickChengAutoMountObserver(
                                attempt + 1
                            ),
                        100
                    );
            }
            return;
        }

        if (linkClickChengAutoObserver) {
            linkClickChengAutoObserver.disconnect();
        }

        let syncQueued = false;

        const queueSync = () => {
            if (syncQueued) return;
            syncQueued = true;

            queueMicrotask(() => {
                syncQueued = false;
                syncLinkClickChengRuntimeFromDom();
            });
        };

        linkClickChengAutoObserver =
            new MutationObserver(queueSync);

        linkClickChengAutoObserver.observe(
            container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: [
                    'src',
                    'class',
                    'style'
                ]
            }
        );

        syncLinkClickChengRuntimeFromDom();

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            180
        );

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            650
        );

        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            1600
        );
    }



    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · CSS LOADER
    // MỘT file CSS duy nhất đảm nhiệm:
    // card + pet realm + full-web skin + popup/form/slider/scrollbar
    // + click toàn trang + ultimate khi nhấn nhân vật.
    // ========================================================
    function ensureLotmKleinStylesheet() {
        if (document.getElementById('lotm-klein-premium-style')) {
            return;
        }

        let href = '';

        if (window.LOTM_KLEIN_CSS_PATH) {
            href = String(window.LOTM_KLEIN_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/lord-of-mysteries-klein.css?v=20260927.realms10', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/lord-of-mysteries-klein.css?v=20260927.realms10', document.baseURI).href;
        }

        // Ép trình duyệt lấy bản CSS Klein mới thay vì cache bản cũ.
        // Nếu dự án gán LOTM_KLEIN_CSS_PATH thì vẫn giữ nguyên đường dẫn đó,
        // chỉ thêm version query an toàn.
        try {
            const cssUrl = new URL(href, document.baseURI);
            cssUrl.searchParams.set('lotmk', '20260914-v2');
            href = cssUrl.href;
        } catch (_) {}

        const link = document.createElement('link');
        link.id = 'lotm-klein-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.lotmKlein = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[LOTM Klein] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/lord-of-mysteries-klein.css?v=20260927.five-realms-v9 hoặc gán window.LOTM_KLEIN_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · FULL PREMIUM RUNTIME V1
    // Namespace: lotm-klein-* / lotmk-*
    // Không gọi ThemeManager / EffectManager và không thay active_theme.
    // ========================================================
    const LuxuryLotmKleinRuntime = {
        realmTimers: new Set(), realmLocked: false, realmLastClick: -1000,
        realmLater(fn,ms) { const timer=setTimeout(()=>{this.realmTimers.delete(timer);fn();},ms);this.realmTimers.add(timer);return timer; },
        clearRealmScene() {
            this.realmTimers.forEach(clearTimeout);this.realmTimers.clear();this.realmLocked=false;this.realmLastClick=-1000;
            this.realmAbort?.abort();this.realmObserver?.disconnect();
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            for(const [key,value] of Object.entries(this.realmAttrs||{})){if(value===null)this.realmPet?.removeAttribute(key);else this.realmPet?.setAttribute(key,value);}
            this.realmPet=null;this.realmAttrs=null;
            document.querySelectorAll('[data-five-realm="klein"]').forEach(n=>n.remove());
            document.documentElement.classList.remove('fr9-klein-equipped');
        },
        realmScene(mode,x=innerWidth/2,y=innerHeight/2) {
            const node=document.createElement('div');node.className='fr9-klein fr9-scene fr9-'+mode;node.dataset.fiveRealm='klein';node.setAttribute('aria-hidden','true');
            node.style.setProperty('--impact-x',x+'px');node.style.setProperty('--impact-y',y+'px');
            node.innerHTML="<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><g class=\"kf-vault\"><g style=\"--i:0\" transform=\"translate(800 430) scale(1)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:1\" transform=\"translate(800 430) scale(0.922)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:2\" transform=\"translate(800 430) scale(0.844)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:3\" transform=\"translate(800 430) scale(0.766)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:4\" transform=\"translate(800 430) scale(0.688)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:5\" transform=\"translate(800 430) scale(0.61)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:6\" transform=\"translate(800 430) scale(0.532)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:7\" transform=\"translate(800 430) scale(0.45399999999999996)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g><g style=\"--i:8\" transform=\"translate(800 430) scale(0.376)\"><path class=\"stone\" d=\"M-650 600V-120Q-650-390 0-400Q650-390 650-120V600H590V-110Q590-320 0-335Q-590-320-590-110V600Z\"/><path class=\"wire\" d=\"M-630 560V-115Q-630-363 0-373Q630-363 630-115V560M-605-80H605M-620 130H-575M575 130H620\"/></g></g><g class=\"kf-doors\"><g transform=\"translate(90 280)\" style=\"--i:0\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g><g transform=\"translate(235 245)\" style=\"--i:1\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g><g transform=\"translate(380 210)\" style=\"--i:2\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g><g transform=\"translate(1510 280)\" style=\"--i:3\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g><g transform=\"translate(1365 245)\" style=\"--i:4\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g><g transform=\"translate(1220 210)\" style=\"--i:5\"><path class=\"stone\" d=\"M-42 400V0Q0-75 42 0V400Z\"/><path class=\"wire\" d=\"M-30 390V6Q0-44 30 6V390M-30 80H30M0 85V370\"/><circle cx=\"18\" cy=\"195\" r=\"3\" class=\"gold\"/></g></g><g class=\"kf-table\"><path class=\"table\" d=\"M715 470H885L1260 880H340Z\"/><path class=\"wire\" d=\"M730 490H870L1210 860H390Z\"/><g transform=\"translate(660 555)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(940 555)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(607 619)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(993 619)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(554 683)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(1046 683)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(501 747)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(1099 747)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(448 811)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g><g transform=\"translate(1152 811)\"><path class=\"stone\" d=\"M-27 15V-50Q0-80 27-50V15L40 65H-40Z\"/><path class=\"wire\" d=\"M-18 5V-45Q0-65 18-45V5\"/></g></g><g class=\"kf-thread\"><path style=\"--i:0\" d=\"M-10 -50Q800 190 250 710\"/><path style=\"--i:1\" d=\"M105 -50Q811 190 330 710\"/><path style=\"--i:2\" d=\"M220 -50Q822 190 410 710\"/><path style=\"--i:3\" d=\"M335 -50Q833 190 490 710\"/><path style=\"--i:4\" d=\"M450 -50Q844 190 570 710\"/><path style=\"--i:5\" d=\"M565 -50Q855 190 650 710\"/><path style=\"--i:6\" d=\"M680 -50Q866 190 730 710\"/><path style=\"--i:7\" d=\"M795 -50Q877 190 810 710\"/><path style=\"--i:8\" d=\"M910 -50Q888 190 890 710\"/><path style=\"--i:9\" d=\"M1025 -50Q899 190 970 710\"/><path style=\"--i:10\" d=\"M1140 -50Q910 190 1050 710\"/><path style=\"--i:11\" d=\"M1255 -50Q921 190 1130 710\"/><path style=\"--i:12\" d=\"M1370 -50Q932 190 1210 710\"/><path style=\"--i:13\" d=\"M1485 -50Q943 190 1290 710\"/><path style=\"--i:14\" d=\"M1600 -50Q954 190 1370 710\"/></g><g class=\"kf-deck\"><g style=\"--i:0\" transform=\"translate(90 290) rotate(-36)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">0</text></g><g style=\"--i:1\" transform=\"translate(207 343.02302821480424) rotate(-30)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">I</text></g><g style=\"--i:2\" transform=\"translate(324 375.6881307431464) rotate(-24)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">II</text></g><g style=\"--i:3\" transform=\"translate(441 375.45370533781676) rotate(-18)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">III</text></g><g style=\"--i:4\" transform=\"translate(558 342.40975845716736) rotate(-12)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">IV</text></g><g style=\"--i:5\" transform=\"translate(675 289.24334773695665) rotate(-6)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">V</text></g><g style=\"--i:6\" transform=\"translate(792 236.3674498573012) rotate(0)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">VI</text></g><g style=\"--i:7\" transform=\"translate(909 204.08350055058054) rotate(6)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">VII</text></g><g style=\"--i:8\" transform=\"translate(1026 204.7867601966652) rotate(12)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">VIII</text></g><g style=\"--i:9\" transform=\"translate(1143 238.20721578243047) rotate(18)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">IX</text></g><g style=\"--i:10\" transform=\"translate(1260 291.5132510435915) rotate(24)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">X</text></g><g style=\"--i:11\" transform=\"translate(1377 344.2382811579775) rotate(30)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">XI</text></g><g style=\"--i:12\" transform=\"translate(1494 376.1387953148376) rotate(36)\"><rect class=\"tarot\" x=\"-28\" y=\"-45\" width=\"56\" height=\"90\" rx=\"3\"/><path class=\"wire\" d=\"M-21-38H21V38H-21ZM0-26L14 0L0 26L-14 0Z\"/><text y=\"4\" text-anchor=\"middle\">XII</text></g></g></svg>"+(mode==='ultimate'?'<div class="fr9-caption"><small>KLEIN MORETTI</small><strong>Sefirah · Nghị Hội Vận Mệnh</strong><span>Màn sương mở lối · Bàn Tarot chờ người</span></div>':'');
            document.body.appendChild(node);return node;
        },
        realmUltimate(x,y) {
            if(this.realmLocked||document.hidden||!document.documentElement.classList.contains('lotm-klein-equipped'))return false;
            this.realmLocked=true;const node=this.realmScene('ultimate',x,y);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.realmLater(()=>node.remove(),reduced?1400:8600);this.realmLater(()=>{this.realmLocked=false;},reduced?1800:9100);return true;
        },

        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        observer: null,
        repairQueued: false,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);

            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.lotm-klein-mystery-magic, ' +
                '#virtual-pet-container #virtual-pet-img.lotm-klein-pet'
            );
        },

        ensurePetInteractivity(pet = this.getPet()) {
            const container =
                document.getElementById('virtual-pet-container');

            if (!container || !pet) {
                return false;
            }

            if (container.style.pointerEvents !== 'auto') {
                container.style.pointerEvents = 'auto';
            }

            if (container.style.visibility !== 'visible') {
                container.style.visibility = 'visible';
            }

            if (container.style.opacity !== '1') {
                container.style.opacity = '1';
            }

            if (pet.style.pointerEvents !== 'auto') {
                pet.style.pointerEvents = 'auto';
            }

            if (pet.style.cursor !== 'pointer') {
                pet.style.cursor = 'pointer';
            }

            pet.setAttribute('draggable', 'false');
            pet.dataset.lotmKleinPremiumInteractive = 'true';

            return true;
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.clearRealmScene();
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler,
                    true
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.repairQueued = false;
            this.clearTimers();

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'lotm-klein-equipped',
                'lotm-klein-skill-active'
            );

            document.body?.classList.remove(
                'theme-lotm-klein-premium'
            );

            document
                .querySelectorAll(
                    '.lotm-klein-world,' +
                    '.lotm-klein-ui-frame,' +
                    '.lotm-klein-page-click,' +
                    '.lotm-klein-ultimate'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            if (
                container &&
                container.__lotmKleinPremiumClickFallback
            ) {
                container.removeEventListener(
                    'click',
                    container.__lotmKleinPremiumClickFallback,
                    true
                );

                delete container.__lotmKleinPremiumClickFallback;
            }

            container?.classList.remove(
                'pet-lotm-klein-stage',
                'lotm-klein-casting'
            );

            container
                ?.querySelectorAll('.lotm-klein-pet-realm')
                .forEach(element => element.remove());

            const activePet =
                container?.querySelector('#virtual-pet-img');

            activePet?.classList.remove('lotm-klein-pet');

            if (activePet?.dataset) {
                delete activePet.dataset.lotmKleinPremiumInteractive;
            }
        },

        createWorld() {
            document.querySelectorAll('.lotm-klein-world').forEach(n=>n.remove());
            document.documentElement.classList.add('fr9-klein-equipped');
            this.realmScene('world').classList.add('lotm-klein-world');
        },

        createInterface() {
            document.querySelectorAll('.lotm-klein-ui-frame').forEach(n=>n.remove());
            const n=document.createElement('div');n.className='fr9-klein fr9-interface lotm-klein-ui-frame';n.dataset.fiveRealm='klein';n.setAttribute('aria-hidden','true');
            n.innerHTML='<i></i><i></i><i></i><i></i>';document.body.appendChild(n);
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');

            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) {
                return false;
            }

            container
                .querySelectorAll('.lotm-klein-pet-realm')
                .forEach(element => element.remove());

            container.classList.add(
                'pet-lotm-klein-stage'
            );

            pet.classList.add(
                'lotm-klein-pet'
            );

            pet.setAttribute('draggable', 'false');
            this.ensurePetInteractivity(pet);

            const realm = document.createElement('div');
            realm.className = 'lotm-klein-pet-realm lotm-klein-pet-realm-v2';
            realm.setAttribute('aria-hidden', 'true');
            realm.dataset.luxuryQualityLayer="1";

            realm.innerHTML = `
                <span class="lotm-klein-pet-aura aura-outer"></span>
                <span class="lotm-klein-pet-aura aura-inner"></span>
                <span class="lotm-klein-pet-halo"></span>
                <span class="lotm-klein-pet-ring ring-a"></span>
                <span class="lotm-klein-pet-ring ring-b"></span>
                <span class="lotm-klein-pet-ring ring-c"></span>
                <span class="lotm-klein-pet-ring ring-d"></span>
                <span class="lotm-klein-pet-arcana-wheel"></span>
                <span class="lotm-klein-pet-crown"></span>
                <span class="lotm-klein-pet-eye"></span>
                <span class="lotm-klein-pet-throne"></span>
                <span class="lotm-klein-pet-floor"></span>
                <span class="lotm-klein-pet-fog fog-a"></span>
                <span class="lotm-klein-pet-fog fog-b"></span>
                <span class="lotm-klein-pet-card-field"></span>
                <span class="lotm-klein-pet-spark-field"></span>
            `;

            const localCards =
                realm.querySelector('.lotm-klein-pet-card-field');

            for (let index = 0; index < 10; index++) {
                const card = document.createElement('i');
                card.className = 'lotm-klein-pet-card';
                card.style.setProperty('--lotmk-pca', `${index * 36}deg`);
                card.style.setProperty('--lotmk-pcd', `${-index * .31}s`);
                card.style.setProperty('--lotmk-pcr', `${-(98 + (index % 3) * 18)}px`);
                localCards?.appendChild(card);
            }

            const sparkField =
                realm.querySelector('.lotm-klein-pet-spark-field');

            const localSparkCount =
                getLuxuryQualityCount(28, 10);

            for (let index = 0; index < localSparkCount; index++) {
                const spark = document.createElement('i');
                spark.className = 'lotm-klein-pet-spark';
                spark.style.setProperty(
                    '--lotmk-psx',
                    `${8 + ((index * 37) % 84)}%`
                );
                spark.style.setProperty(
                    '--lotmk-psy',
                    `${10 + ((index * 53) % 78)}%`
                );
                spark.style.setProperty(
                    '--lotmk-psd',
                    `${-(index % 9) * .34}s`
                );
                spark.style.setProperty(
                    '--lotmk-pss',
                    `${2 + (index % 4)}px`
                );
                sparkField?.appendChild(spark);
            }

            container.insertBefore(
                realm,
                pet
            );

            this.activePetElement = pet;
            return true;
        },

        createPageClick(x,y) {if(!document.documentElement.classList.contains('lotm-klein-equipped'))return;return luxuryTapBloom11(this,'klein',x,y);
        },

        installGlobalClick() {installLuxuryGestures10(this,'klein','lotm-klein-equipped',(x,y)=>this.createPageClick(x,y));
        },

        createUltimate(x,y) { return this.realmUltimate(x,y); },

        installPetSkill() {
            const pet=this.getPet?.()||document.querySelector('#virtual-pet-img');const container=pet?.closest('#virtual-pet-container');if(!pet||!container)return false;
            if(this.realmPet===pet)return true;
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            this.realmPet=pet;this.activePetElement=pet;
            this.realmAttrs=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',"Sefirah · Nghị Hội Vận Mệnh");
            this.realmClick=e=>{
                if(!document.documentElement.classList.contains('lotm-klein-equipped')||container.dataset.petDragged==='1'||(typeof PetInteractionManager!=='undefined'&&PetInteractionManager.isPetDragging))return;
                e.preventDefault();e.stopImmediatePropagation();e.__nyxUltimateHandled=true;
                const rect=pet.getBoundingClientRect();this.realmUltimate(rect.x+rect.width/2,rect.y+rect.height/2);
            };
            this.realmKey=e=>{if(e.key==='Enter'||e.key===' '){this.realmClick(e);}};
            pet.addEventListener('click',this.realmClick,true);pet.addEventListener('keydown',this.realmKey);
            this.realmAbort?.abort();this.realmAbort=new AbortController();
            document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-five-realm="klein"]').forEach(n=>n.classList.toggle('fr9-paused',document.hidden)),{signal:this.realmAbort.signal});
            this.realmObserver?.disconnect();this.realmObserver=new MutationObserver(()=>{if(!pet.isConnected||container.hidden||container.style.display==='none')this.clear();});
            this.realmObserver.observe(container.parentNode,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
            return true;
        },

        repair() {
            if (
                !document.documentElement.classList.contains(
                    'lotm-klein-equipped'
                )
            ) {
                return false;
            }

            ensureLotmKleinStylesheet();

            document.body?.classList.add(
                'theme-lotm-klein-premium'
            );

            if (!document.querySelector('.lotm-klein-world')) {
                this.createWorld();
            }

            if (!document.querySelector('.lotm-klein-ui-frame')) {
                this.createInterface();
            }

            const container =
                document.getElementById('virtual-pet-container');

            const pet =
                container?.querySelector('#virtual-pet-img');

            if (container && pet) {
                if (
                    !pet.classList.contains('lotm-klein-pet') ||
                    !container.querySelector('.lotm-klein-pet-realm')
                ) {
                    this.createPetRealm();
                }

                this.ensurePetInteractivity(pet);

                /*
                 * Rebind mỗi lần repair:
                 * removeEventListener + addEventListener trong installPetSkill()
                 * là idempotent và giúp khôi phục click nếu DOM/runtime khác
                 * đã làm mất listener mà reference cũ vẫn còn.
                 */
                this.installPetSkill();
            }

            if (!this.documentClickHandler) {
                this.installGlobalClick();
            }

            return true;
        },

        installObserver() {
            const container =
                document.getElementById('virtual-pet-container');

            if (!container) {
                return false;
            }

            if (this.observer) {
                this.observer.disconnect();
            }

            this.observer = new MutationObserver(() => {
                if (
                    !document.documentElement.classList.contains(
                        'lotm-klein-equipped'
                    ) ||
                    this.repairQueued
                ) {
                    return;
                }

                this.repairQueued = true;

                queueMicrotask(() => {
                    this.repairQueued = false;
                    this.repair();
                });
            });

            this.observer.observe(
                container,
                {
                    childList: true,
                    subtree: true,
                    attributes: true,
                    attributeFilter: [
                        'src',
                        'class',
                        'style'
                    ]
                }
            );

            return true;
        },

        mount() {
            ensureLotmKleinStylesheet();
            this.clear();

            document.documentElement.classList.add(
                'lotm-klein-equipped'
            );

            document.body?.classList.add(
                'theme-lotm-klein-premium'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();
            this.installObserver();

            [100, 320, 720, 1400, 2600].forEach(delay => {
                this.setTimer(() => {
                    this.repair();
                }, delay);
            });

            return true;
        },

        restore(attempt = 0) {
            ensureLotmKleinStylesheet();

            const pet = this.getPet();
            const activePetId = localStorage.getItem('active_pet');

            if (
                activePetId !== 'pet_lotm_klein_event_1' &&
                !pet
            ) {
                return false;
            }

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 28) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    140 + attempt * 30
                );
            }

            return false;
        }
    };


    // ========================================================
    // LORD OF THE MYSTERIES · KLEIN · AUTO-MOUNT BRIDGE
    // Nếu PetManager render trước/sau LuxuryStore hoặc DOM pet bị dựng lại,
    // runtime vẫn tự phục hồi world + UI + realm + kỹ năng nhấn.
    // ========================================================
    let lotmKleinAutoObserver = null;
    let lotmKleinAutoRetryTimer = null;
    let lotmKleinAutoSyncQueued = false;

    function syncLotmKleinRuntimeFromDom() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const pet = document.querySelector(
            '#virtual-pet-container #virtual-pet-img.lotm-klein-mystery-magic, ' +
            '#virtual-pet-container #virtual-pet-img.lotm-klein-pet'
        );

        if (!pet) {
            return;
        }

        const needsMount =
            !document.documentElement.classList.contains('lotm-klein-equipped') ||
            !document.querySelector('.lotm-klein-world') ||
            !document.querySelector('.lotm-klein-ui-frame') ||
            !document.querySelector('#virtual-pet-container .lotm-klein-pet-realm');

        if (needsMount) {
            LuxuryLotmKleinRuntime.mount();
        } else {
            LuxuryLotmKleinRuntime.repair();
        }
    }

    function installLotmKleinAutoMountObserver(attempt = 0) {
        const container =
            document.getElementById('virtual-pet-container');

        if (!container) {
            if (attempt < 80) {
                window.clearTimeout(lotmKleinAutoRetryTimer);
                lotmKleinAutoRetryTimer = window.setTimeout(
                    () => installLotmKleinAutoMountObserver(attempt + 1),
                    100
                );
            }
            return;
        }

        lotmKleinAutoObserver?.disconnect();

        const queueSync = () => {
            if (lotmKleinAutoSyncQueued) return;
            lotmKleinAutoSyncQueued = true;

            queueMicrotask(() => {
                lotmKleinAutoSyncQueued = false;
                syncLotmKleinRuntimeFromDom();
            });
        };

        lotmKleinAutoObserver =
            new MutationObserver(queueSync);

        lotmKleinAutoObserver.observe(
            container,
            {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['src', 'class', 'style']
            }
        );

        syncLotmKleinRuntimeFromDom();

        [180, 650, 1600].forEach(delay => {
            window.setTimeout(syncLotmKleinRuntimeFromDom, delay);
        });
    }

    installLotmKleinAutoMountObserver();


    // ========================================================
    // CẦM CƠ · CẦM MỘNG · CSS LOADER
    // MỘT file CSS duy nhất đảm nhiệm card + pet realm + full web skin
    // + popup/input/slider/scrollbar + click + ultimate.
    // ========================================================
    function ensureCamCoCamMongStylesheet() {
        if (document.getElementById('cam-co-cam-mong-premium-style')) {
            return;
        }

        let href = '';

        if (window.CAM_CO_CAM_MONG_CSS_PATH) {
            href = String(window.CAM_CO_CAM_MONG_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/cam-co-cam-mong.css?v=20260927.realms10', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/cam-co-cam-mong.css?v=20260927.realms10', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'cam-co-cam-mong-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.camCoCamMong = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Cầm Mộng] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/cam-co-cam-mong.css?v=20260927.five-realms-v9 hoặc gán window.CAM_CO_CAM_MONG_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }


    // ========================================================
    // CẦM CƠ · CẦM MỘNG · FULL PREMIUM RUNTIME V1
    // Namespace: cam-co-cam-mong-*
    // KHÔNG gọi ThemeManager / EffectManager, KHÔNG thay active_theme
    // hay active_effect. Runtime chỉ sống theo pet đang được trang bị.
    // ========================================================
    const LuxuryCamCoCamMongRuntime = {
        realmTimers: new Set(), realmLocked: false, realmLastClick: -1000,
        realmLater(fn,ms) { const timer=setTimeout(()=>{this.realmTimers.delete(timer);fn();},ms);this.realmTimers.add(timer);return timer; },
        clearRealmScene() {
            this.realmTimers.forEach(clearTimeout);this.realmTimers.clear();this.realmLocked=false;this.realmLastClick=-1000;
            this.realmAbort?.abort();this.realmObserver?.disconnect();
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            for(const [key,value] of Object.entries(this.realmAttrs||{})){if(value===null)this.realmPet?.removeAttribute(key);else this.realmPet?.setAttribute(key,value);}
            this.realmPet=null;this.realmAttrs=null;
            document.querySelectorAll('[data-five-realm="cam"]').forEach(n=>n.remove());
            document.documentElement.classList.remove('fr9-cam-equipped');
        },
        realmScene(mode,x=innerWidth/2,y=innerHeight/2) {
            const node=document.createElement('div');node.className='fr9-cam fr9-scene fr9-'+mode;node.dataset.fiveRealm='cam';node.setAttribute('aria-hidden','true');
            node.style.setProperty('--impact-x',x+'px');node.style.setProperty('--impact-y',y+'px');
            node.innerHTML="<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><g class=\"cm-scroll\"><path class=\"paper\" d=\"M90 140Q430 60 800 140T1510 140V620Q1180 535 800 620T90 620Z\"/><path class=\"wire\" d=\"M110 159Q430 79 800 159T1490 159M110 600Q430 515 800 600T1490 600\"/><path class=\"wood\" d=\"M65 120H105V655H65ZM1495 120H1535V655H1495Z\"/></g><g class=\"cm-ink\"><path style=\"--i:0\" d=\"M100 535q35-140 65-220q24 160 62 40q45-175 76 20q24 110 83 160Z\"/><path style=\"--i:1\" d=\"M380 535q35-140 65-220q24 160 62 40q45-175 76 20q24 110 83 160Z\"/><path style=\"--i:2\" d=\"M660 535q35-140 65-220q24 160 62 40q45-175 76 20q24 110 83 160Z\"/><path style=\"--i:3\" d=\"M940 535q35-140 65-220q24 160 62 40q45-175 76 20q24 110 83 160Z\"/><path style=\"--i:4\" d=\"M1220 535q35-140 65-220q24 160 62 40q45-175 76 20q24 110 83 160Z\"/></g><g class=\"cm-water\"><path style=\"--i:0\" d=\"M120 580Q450 550 790 580T1490 580\"/><path style=\"--i:1\" d=\"M110 600Q450 570 790 600T1500 600\"/><path style=\"--i:2\" d=\"M100 620Q450 590 790 620T1510 620\"/><path style=\"--i:3\" d=\"M90 640Q450 610 790 640T1520 640\"/><path style=\"--i:4\" d=\"M80 660Q450 630 790 660T1530 660\"/><path style=\"--i:5\" d=\"M70 680Q450 650 790 680T1540 680\"/><path style=\"--i:6\" d=\"M60 700Q450 670 790 700T1550 700\"/><path style=\"--i:7\" d=\"M50 720Q450 690 790 720T1560 720\"/><path style=\"--i:8\" d=\"M40 740Q450 710 790 740T1570 740\"/><path style=\"--i:9\" d=\"M30 760Q450 730 790 760T1580 760\"/><path style=\"--i:10\" d=\"M20 780Q450 750 790 780T1590 780\"/><path style=\"--i:11\" d=\"M10 800Q450 770 790 800T1600 800\"/><path style=\"--i:12\" d=\"M0 820Q450 790 790 820T1610 820\"/><path style=\"--i:13\" d=\"M-10 840Q450 810 790 840T1620 840\"/></g><g class=\"cm-qin\"><path class=\"wood\" d=\"M120 650Q310 590 470 620L1410 690Q1460 725 1400 760L410 725Q240 770 120 710Z\"/><path class=\"wire\" d=\"M155 658Q310 617 470 635L1400 702M155 704Q300 745 410 708L1400 745\"/><path class=\"string\" style=\"--i:0\" d=\"M150 663Q730 510 1415 707\"/><path class=\"string\" style=\"--i:1\" d=\"M150 669Q730 546 1415 713\"/><path class=\"string\" style=\"--i:2\" d=\"M150 675Q730 582 1415 719\"/><path class=\"string\" style=\"--i:3\" d=\"M150 681Q730 618 1415 725\"/><path class=\"string\" style=\"--i:4\" d=\"M150 687Q730 654 1415 731\"/><path class=\"string\" style=\"--i:5\" d=\"M150 693Q730 690 1415 737\"/><path class=\"string\" style=\"--i:6\" d=\"M150 699Q730 726 1415 743\"/><circle class=\"gold\" cx=\"360\" cy=\"643\" r=\"3\"/><circle class=\"gold\" cx=\"436\" cy=\"648\" r=\"3\"/><circle class=\"gold\" cx=\"512\" cy=\"653\" r=\"3\"/><circle class=\"gold\" cx=\"588\" cy=\"658\" r=\"3\"/><circle class=\"gold\" cx=\"664\" cy=\"663\" r=\"3\"/><circle class=\"gold\" cx=\"740\" cy=\"668\" r=\"3\"/><circle class=\"gold\" cx=\"816\" cy=\"673\" r=\"3\"/><circle class=\"gold\" cx=\"892\" cy=\"678\" r=\"3\"/><circle class=\"gold\" cx=\"968\" cy=\"683\" r=\"3\"/><circle class=\"gold\" cx=\"1044\" cy=\"688\" r=\"3\"/><circle class=\"gold\" cx=\"1120\" cy=\"693\" r=\"3\"/><circle class=\"gold\" cx=\"1196\" cy=\"698\" r=\"3\"/><circle class=\"gold\" cx=\"1272\" cy=\"703\" r=\"3\"/></g><g class=\"cm-petals\"><path style=\"--i:0\" transform=\"translate(0 240) rotate(0)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:1\" transform=\"translate(82 349.3912280250265) rotate(28)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:2\" transform=\"translate(164 358.20866548733864) rotate(56)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:3\" transform=\"translate(246 258.34560104778274) rotate(84)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:4\" transform=\"translate(328 141.61567560996934) rotate(112)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:5\" transform=\"translate(410 115.339844293792) rotate(140)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:6\" transform=\"translate(492 203.67598523413963) rotate(168)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:7\" transform=\"translate(574 325.4082578334426) rotate(196)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:8\" transform=\"translate(656 368.6165720610396) rotate(224)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:9\" transform=\"translate(738 293.57540308142836) rotate(252)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:10\" transform=\"translate(820 169.27725558438192) rotate(280)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:11\" transform=\"translate(902 110.00127314840856) rotate(308)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:12\" transform=\"translate(984 170.24552065994345) rotate(336)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:13\" transform=\"translate(1066 294.6217147874633) rotate(364)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:14\" transform=\"translate(1148 368.7789562403332) rotate(392)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:15\" transform=\"translate(1230 324.5374192204252) rotate(420)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:16\" transform=\"translate(1312 202.5725688335415) rotate(448)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:17\" transform=\"translate(1394 115.01832605565761) rotate(476)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:18\" transform=\"translate(1476 142.3716579196821) rotate(504)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/><path style=\"--i:19\" transform=\"translate(1558 259.4840372561838) rotate(532)\" d=\"M0 0Q-35-15-12-35Q12-42 0 0Q30-22 33 2Q20 20 0 0Z\"/></g><g class=\"cm-notes\"><text style=\"--i:0\" x=\"190\" y=\"365\">宮</text><text style=\"--i:1\" x=\"365\" y=\"440.7323886327107\">商</text><text style=\"--i:2\" x=\"540\" y=\"446.83676841431134\">角</text><text style=\"--i:3\" x=\"715\" y=\"377.70080072538804\">徵</text><text style=\"--i:4\" x=\"890\" y=\"296.8877754222865\">羽</text><text style=\"--i:5\" x=\"1065\" y=\"278.69681528031754\">琴</text><text style=\"--i:6\" x=\"1240\" y=\"339.85260516209667\">心</text><text style=\"--i:7\" x=\"1415\" y=\"424.128793884691\">夢</text></g></svg>"+(mode==='ultimate'?'<div class="fr9-caption"><small>LẠC THANH HUYỀN</small><strong>Nhất Khúc · Sơn Hà Nhập Mộng</strong><span>Bảy dây ngân · Thủy mặc hóa tiên cảnh</span></div>':'');
            document.body.appendChild(node);return node;
        },
        realmUltimate(x,y) {
            if(this.realmLocked||document.hidden||!document.documentElement.classList.contains('cam-co-cam-mong-equipped'))return false;
            this.realmLocked=true;const node=this.realmScene('ultimate',x,y);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.realmLater(()=>node.remove(),reduced?1400:8600);this.realmLater(()=>{this.realmLocked=false;},reduced?1800:9100);return true;
        },

        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.clearRealmScene();
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'cam-co-cam-mong-equipped'
            );
            document.body?.classList.remove(
                'theme-cam-co-cam-mong'
            );

            document
                .querySelectorAll(
                    '.cam-co-cam-mong-world,' +
                    '.cam-co-cam-mong-ui-frame,' +
                    '.cam-co-cam-mong-page-click,' +
                    '.cam-co-cam-mong-ultimate,' +
                    '.cam-co-cam-mong-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById('virtual-pet-container');

            container?.classList.remove(
                'pet-cam-co-cam-mong-stage',
                'cam-co-cam-mong-casting'
            );

            container
                ?.querySelectorAll('.cam-co-cam-mong-pet-realm')
                .forEach(element => element.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('cam-co-cam-mong-pet');
        },

        createWorld() {
            document.querySelectorAll('.cam-co-cam-mong-world').forEach(n=>n.remove());
            document.documentElement.classList.add('fr9-cam-equipped');
            this.realmScene('world').classList.add('cam-co-cam-mong-world');
        },

        createInterface() {
            document.querySelectorAll('.cam-co-cam-mong-ui-frame').forEach(n=>n.remove());
            const n=document.createElement('div');n.className='fr9-cam fr9-interface cam-co-cam-mong-ui-frame';n.dataset.fiveRealm='cam';n.setAttribute('aria-hidden','true');
            n.innerHTML='<i></i><i></i><i></i><i></i>';document.body.appendChild(n);
        },

        createPetRealm() {
            const container =
                document.getElementById('virtual-pet-container');
            const pet =
                container?.querySelector('#virtual-pet-img');

            if (!container || !pet) return;

            container.classList.add('pet-cam-co-cam-mong-stage');
            pet.classList.add('cam-co-cam-mong-pet');

            container
                .querySelectorAll('.cam-co-cam-mong-pet-realm')
                .forEach(element => element.remove());

            const realm = document.createElement('div');
            realm.className = 'cam-co-cam-mong-pet-realm cam-co-ancient-pet-realm-v2';
            realm.setAttribute('aria-hidden', 'true');
            realm.dataset.luxuryQualityLayer="1";
            realm.setAttribute('data-effect-quality-root', '1');

            realm.innerHTML = `
                <span class="cam-co-pet-halo"></span>
                <span class="cam-co-pet-moon"></span>
                <span class="cam-co-pet-ring ring-a"></span>
                <span class="cam-co-pet-ring ring-b"></span>
                <span class="cam-co-pet-ring ring-c"></span>

                <span class="cam-co-pet-cloud cloud-a"></span>
                <span class="cam-co-pet-cloud cloud-b"></span>
                <span class="cam-co-pet-cloud cloud-c"></span>

                <span class="cam-co-pet-ribbon ribbon-a"></span>
                <span class="cam-co-pet-ribbon ribbon-b"></span>

                <span class="cam-co-pet-qin"></span>

                <span class="cam-co-pet-lotus">
                    <i></i><i></i><i></i><i></i><i></i><i></i><b></b>
                </span>

                <span class="cam-co-pet-talisman talisman-a">琴</span>
                <span class="cam-co-pet-talisman talisman-b">梦</span>
                <span class="cam-co-pet-talisman talisman-c">仙</span>

                <span class="cam-co-pet-notes"></span>
                <span class="cam-co-pet-sparks"></span>
                <span class="cam-co-pet-petals"></span>
            `;

            const notes = realm.querySelector('.cam-co-pet-notes');
            ['♪','✦','♫','❀','♪','✧','♫','☾','✦','♪','梦','琴','❀','♫'].forEach((symbol, index) => {
                const note = document.createElement('i');
                note.textContent = symbol;
                note.style.setProperty('--cc-ni', index);
                note.style.setProperty('--cc-nd', `${-(index % 7) * .28}s`);
                notes?.appendChild(note);
            });

            const sparks = realm.querySelector('.cam-co-pet-sparks');
            for (let index = 0; index < 26; index++) {
                const spark = document.createElement('i');
                spark.style.setProperty('--cc-psa', `${index * (360 / 26)}deg`);
                spark.style.setProperty('--cc-psad', `${index * -(360 / 26)}deg`);
                spark.style.setProperty('--cc-psr-neg', `${-(72 + (index % 6) * 17)}px`);
                spark.style.setProperty('--cc-psd', `${-(index % 9) * .23}s`);
                sparks?.appendChild(spark);
            }

            const petals = realm.querySelector('.cam-co-pet-petals');
            for (let index = 0; index < 20; index++) {
                const petal = document.createElement('i');
                petal.style.setProperty('--cc-ppa', `${index * 18}deg`);
                petal.style.setProperty('--cc-ppad', `${index * -18}deg`);
                petal.style.setProperty('--cc-ppr-neg', `${-(66 + (index % 5) * 18)}px`);
                petal.style.setProperty('--cc-ppd', `${-(index % 8) * .31}s`);
                petals?.appendChild(petal);
            }

            container.insertBefore(realm, pet);
            this.installPetSkill(pet, container);
        },

        installPetSkill() {
            const pet=this.getPet?.()||document.querySelector('#virtual-pet-img');const container=pet?.closest('#virtual-pet-container');if(!pet||!container)return false;
            if(this.realmPet===pet)return true;
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            this.realmPet=pet;this.activePetElement=pet;
            this.realmAttrs=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',"Nhất Khúc · Sơn Hà Nhập Mộng");
            this.realmClick=e=>{
                if(!document.documentElement.classList.contains('cam-co-cam-mong-equipped')||container.dataset.petDragged==='1'||(typeof PetInteractionManager!=='undefined'&&PetInteractionManager.isPetDragging))return;
                e.preventDefault();e.stopImmediatePropagation();e.__nyxUltimateHandled=true;
                const rect=pet.getBoundingClientRect();this.realmUltimate(rect.x+rect.width/2,rect.y+rect.height/2);
            };
            this.realmKey=e=>{if(e.key==='Enter'||e.key===' '){this.realmClick(e);}};
            pet.addEventListener('click',this.realmClick,true);pet.addEventListener('keydown',this.realmKey);
            this.realmAbort?.abort();this.realmAbort=new AbortController();
            document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-five-realm="cam"]').forEach(n=>n.classList.toggle('fr9-paused',document.hidden)),{signal:this.realmAbort.signal});
            this.realmObserver?.disconnect();this.realmObserver=new MutationObserver(()=>{if(!pet.isConnected||container.hidden||container.style.display==='none')this.clear();});
            this.realmObserver.observe(container.parentNode,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
            return true;
        },

        installGlobalClick() {installLuxuryGestures10(this,'cam','cam-co-cam-mong-equipped',(x,y)=>this.createPageClick(x,y));
        },

        createPageClick(x,y) {if(!document.documentElement.classList.contains('cam-co-cam-mong-equipped'))return;return luxuryTapBloom11(this,'cam',x,y);
        },

        createUltimate(x,y) { return this.realmUltimate(x,y); },

        mount() {
            this.clear();
            ensureCamCoCamMongStylesheet();

            document.documentElement.classList.add('cam-co-cam-mong-equipped');
            document.body?.classList.add('theme-cam-co-cam-mong');

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            const repairMount = () => {
                if (!document.documentElement.classList.contains('cam-co-cam-mong-equipped')) return;
                if (!document.querySelector('.cam-co-cam-mong-world')) this.createWorld();
                if (!document.querySelector('.cam-co-cam-mong-ui-frame')) this.createInterface();

                const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
                if (pet && !document.querySelector('#virtual-pet-container .cam-co-cam-mong-pet-realm')) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        }
    };


    // ========================================================
    // TAMON'S B-SIDE · CSS LOADER
    // Một file CSS đảm nhiệm toàn bộ skin / animation.
    // Có thể đặt window.TAMON_BSIDE_CSS_PATH trước khi file này chạy
    // nếu project lưu CSS ở đường dẫn khác.
    // ========================================================
    function ensureTamonBSideStylesheet() {
        if (document.getElementById('tamon-b-side-premium-style')) {
            return;
        }

        /*
         * Project hiện tại đặt JavaScript trong /js và CSS trong /css.
         * Trước đây href='tamon-b-side.css' bị browser hiểu theo URL của
         * trang HTML, nên phát sinh ERR_FILE_NOT_FOUND.
         *
         * Ưu tiên:
         * 1) window.TAMON_BSIDE_CSS_PATH nếu project tự cấu hình.
         * 2) Tự suy ra ../css/tamon-b-side.css từ chính luxury-store.js.
         * 3) Fallback css/tamon-b-side.css theo document.baseURI.
         */
        let href = '';

        if (window.TAMON_BSIDE_CSS_PATH) {
            href = String(window.TAMON_BSIDE_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script => /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i.test(script.src || ''));

            if (ownScript?.src) {
                try {
                    href = new URL('../css/tamon-b-side.css?v=20260927.realms10', ownScript.src).href;
                } catch (error) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL('css/tamon-b-side.css?v=20260927.realms10', document.baseURI).href;
        }

        const link = document.createElement('link');
        link.id = 'tamon-b-side-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.tamonBside = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[Tamon B-Side] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/tamon-b-side.css hoặc gán window.TAMON_BSIDE_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
    }



    // ========================================================
    // TAMON · PINK STATIC · CSS LOADER
    // Dùng CHUNG file css/tamon-b-side.css với pet 1.
    // ========================================================
    function ensureTamonPinkStaticStylesheet() {
        ensureTamonBSideStylesheet();
    }


    // ========================================================
    // TAMON'S B-SIDE · FULL PREMIUM RUNTIME V1
    // Namespace: tamon-bside-*
    // Không đụng active_theme / active_effect, vì vậy pet này không
    // ghi đè dữ liệu giao diện hoặc hiệu ứng khác trong localStorage.
    // ========================================================
    const LuxuryTamonBSideRuntime = {
        design10() { return LUX_CONFIG10["rose"]; },
        sceneLocked10: false, lastTap10: -1000,
        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);

            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => {
                window.clearTimeout(timer);
            });
            this.timers.clear();
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryScene10(this);
            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
                document.removeEventListener(
                    'click',
                    this.documentPointerHandler,
                    true
                );
            }

            this.clearTimers();

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'tamon-bside-equipped'
            );

            document.body?.classList.remove(
                'theme-tamon-bside-stage'
            );

            document
                .querySelectorAll(
                    '.tamon-bside-world,' +
                    '.tamon-bside-ui-frame,' +
                    '.tamon-bside-page-click,' +
                    '.tamon-bside-ultimate,' +
                    '.tamon-bside-screen-dialogue'
                )
                .forEach(element => element.remove());

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            container?.classList.remove(
                'pet-tamon-bside-stage',
                'tamon-bside-pet-casting'
            );

            container
                ?.querySelectorAll(
                    '.tamon-bside-pet-realm'
                )
                .forEach(element => element.remove());

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            pet?.classList.remove(
                'tamon-bside-pet'
            );
        },

        createWorld() {const c=this.design10();document.querySelectorAll('.'+c.world).forEach(n=>n.remove());document.documentElement.classList.add('lux10-'+c.id+'-equipped');luxuryScene10(this,'world').classList.add(c.world);
        },

        createInterface() {const c=this.design10();document.querySelectorAll('.'+c.ui).forEach(n=>n.remove());const n=document.createElement('div');n.className='lux10-interface lux10-'+c.id+' '+c.ui;n.dataset.scene10=c.id;n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b><em></em>';document.body.appendChild(n);
        },

        createPetRealm() {return luxuryPet10(this);
        },

        installPetSkill() {return luxuryPet10(this);
        },

        installGlobalClick() {const c=this.design10();installLuxuryGestures10(this,c.id,c.root,(x,y)=>this.createPageClick(x,y));
        },

        createPageClick(x,y) {const c=this.design10();if(!document.documentElement.classList.contains(c.root))return;return luxuryTapBloom11(this,c.id,x,y);
        },

        createUltimate(x,y) {return luxuryUltimate10(this,x,y);
        },

        mount() {
            this.clear();
            ensureTamonBSideStylesheet();

            document.documentElement.classList.add(
                'tamon-bside-equipped'
            );

            document.body?.classList.add(
                'theme-tamon-bside-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            /*
             * Một số trang gọi render/spawn liên tiếp trong cùng frame.
             * Tự kiểm tra lại để world / HUD / pet realm không bị render
             * tiếp theo xóa mất.
             */
            const repairMount = () => {
                if (
                    !document.documentElement.classList.contains(
                        'tamon-bside-equipped'
                    )
                ) {
                    return;
                }

                if (!document.querySelector('.tamon-bside-world')) {
                    this.createWorld();
                }

                if (!document.querySelector('.tamon-bside-ui-frame')) {
                    this.createInterface();
                }

                const pet =
                    document.querySelector(
                        '#virtual-pet-container #virtual-pet-img'
                    );

                if (
                    pet &&
                    !document.querySelector(
                        '#virtual-pet-container .tamon-bside-pet-realm'
                    )
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repairMount, 120);
            this.setTimer(repairMount, 520);
            this.setTimer(repairMount, 1200);
        }
    };



    // ========================================================
    // TAMON · HẮC PHẤN NGHỊCH NHỊP · FULL PREMIUM RUNTIME V1
    // Namespace mới: tamon-pinkstatic-*
    // Concept: cassette / sticker / scanline / black-pink backstage.
    // Không gọi ThemeManager / EffectManager và không dùng tamon-bside-*.
    // ========================================================
    const LuxuryTamonPinkStaticRuntime = {
        design10() { return LUX_CONFIG10["cat"]; },
        sceneLocked10: false, lastTap10: -1000,
        activePetElement: null,
        petClickHandler: null,
        documentClickHandler: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryScene10(this);
            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentClickHandler) {
                document.removeEventListener(
                    'click',
                    this.documentClickHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentClickHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'tamon-pinkstatic-equipped'
            );
            document.body?.classList.remove(
                'theme-tamon-pinkstatic-stage'
            );

            document
                .querySelectorAll(
                    '.tamon-pinkstatic-world,' +
                    '.tamon-pinkstatic-ui,' +
                    '.tamon-pinkstatic-click,' +
                    '.tamon-pinkstatic-ultimate,' +
                    '.tamon-pinkstatic-dialogue'
                )
                .forEach(node => node.remove());

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-tamon-pinkstatic-stage',
                'tamon-pinkstatic-casting'
            );

            container
                ?.querySelectorAll('.tamon-pinkstatic-realm')
                .forEach(node => node.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('tamon-pinkstatic-pet');
        },

        createWorld() {const c=this.design10();document.querySelectorAll('.'+c.world).forEach(n=>n.remove());document.documentElement.classList.add('lux10-'+c.id+'-equipped');luxuryScene10(this,'world').classList.add(c.world);
        },

        createInterface() {const c=this.design10();document.querySelectorAll('.'+c.ui).forEach(n=>n.remove());const n=document.createElement('div');n.className='lux10-interface lux10-'+c.id+' '+c.ui;n.dataset.scene10=c.id;n.setAttribute('aria-hidden','true');n.innerHTML='<i></i><b></b><em></em>';document.body.appendChild(n);
        },

        createPetRealm() {return luxuryPet10(this);
        },

        installGlobalClick() {const c=this.design10();installLuxuryGestures10(this,c.id,c.root,(x,y)=>this.createPageClick(x,y));
        },

        createPageClick(x,y) {const c=this.design10();if(!document.documentElement.classList.contains(c.root))return;return luxuryTapBloom11(this,c.id,x,y);
        },

        triggerUltimate(x,y) {return luxuryUltimate10(this,x,y);
        },

        mount() {
            this.clear();
            ensureTamonPinkStaticStylesheet();

            document.documentElement.classList.add(
                'tamon-pinkstatic-equipped'
            );
            document.body?.classList.add(
                'theme-tamon-pinkstatic-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();

            const repair = () => {
                if (!document.documentElement.classList.contains(
                    'tamon-pinkstatic-equipped'
                )) {
                    return;
                }
                if (!document.querySelector('.tamon-pinkstatic-world')) {
                    this.createWorld();
                }
                if (!document.querySelector('.tamon-pinkstatic-ui')) {
                    this.createInterface();
                }
                const pet = document.querySelector(
                    '#virtual-pet-container #virtual-pet-img'
                );
                if (
                    pet &&
                    !document.querySelector(
                        '#virtual-pet-container .tamon-pinkstatic-realm'
                    )
                ) {
                    this.createPetRealm();
                }
            };

            this.setTimer(repair, 120);
            this.setTimer(repair, 520);
            this.setTimer(repair, 1200);
        }
    };



    // ========================================================
    // AETHER · CSS LAZY GUARD
    // Một CSS duy nhất cho card + pet + full-web suite.
    // ========================================================
    function ensureAetherStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)aether-than-thoai(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'aether-mythic-premium-style';
            return existing;
        }

        const byId = document.getElementById(
            'aether-mythic-premium-style'
        );
        if (byId) return byId;

        let href = '';

        if (window.AETHER_MYTHIC_CSS_PATH) {
            href = String(window.AETHER_MYTHIC_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/aether-than-thoai.css?v=20260927.realms10',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/aether-than-thoai.css?v=20260927.realms10',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'aether-mythic-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.aetherMythic = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[AETHER] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/aether-than-thoai.css?v=20260927.five-realms-v9 hoặc gán window.AETHER_MYTHIC_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }

    // ========================================================
    // AETHER · THIÊN QUANG NGUYÊN SƠ — FULL PREMIUM SUITE V1
    // JS chỉ dựng DOM/lifecycle. Toàn bộ giao diện nằm trong 1 CSS.
    // Namespace độc lập: aether-mythic-* / aetherLuminous*
    // ========================================================
    const LuxuryAetherRuntime = {
        realmTimers: new Set(), realmLocked: false, realmLastClick: -1000,
        realmLater(fn,ms) { const timer=setTimeout(()=>{this.realmTimers.delete(timer);fn();},ms);this.realmTimers.add(timer);return timer; },
        clearRealmScene() {
            this.realmTimers.forEach(clearTimeout);this.realmTimers.clear();this.realmLocked=false;this.realmLastClick=-1000;
            this.realmAbort?.abort();this.realmObserver?.disconnect();
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            for(const [key,value] of Object.entries(this.realmAttrs||{})){if(value===null)this.realmPet?.removeAttribute(key);else this.realmPet?.setAttribute(key,value);}
            this.realmPet=null;this.realmAttrs=null;
            document.querySelectorAll('[data-five-realm="aether"]').forEach(n=>n.remove());
            document.documentElement.classList.remove('fr9-aether-equipped');
        },
        realmScene(mode,x=innerWidth/2,y=innerHeight/2) {
            const node=document.createElement('div');node.className='fr9-aether fr9-scene fr9-'+mode;node.dataset.fiveRealm='aether';node.setAttribute('aria-hidden','true');
            node.style.setProperty('--impact-x',x+'px');node.style.setProperty('--impact-y',y+'px');
            node.innerHTML="<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><g class=\"ae-radiator\"><path style=\"--i:0\" transform=\"rotate(0 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:1\" transform=\"rotate(15 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:2\" transform=\"rotate(30 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:3\" transform=\"rotate(45 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:4\" transform=\"rotate(60 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:5\" transform=\"rotate(75 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:6\" transform=\"rotate(90 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:7\" transform=\"rotate(105 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:8\" transform=\"rotate(120 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:9\" transform=\"rotate(135 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:10\" transform=\"rotate(150 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:11\" transform=\"rotate(165 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:12\" transform=\"rotate(180 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:13\" transform=\"rotate(195 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:14\" transform=\"rotate(210 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:15\" transform=\"rotate(225 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:16\" transform=\"rotate(240 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:17\" transform=\"rotate(255 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:18\" transform=\"rotate(270 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:19\" transform=\"rotate(285 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:20\" transform=\"rotate(300 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:21\" transform=\"rotate(315 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:22\" transform=\"rotate(330 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/><path style=\"--i:23\" transform=\"rotate(345 800 395)\" class=\"beam\" d=\"M790 275L772-200H828L810 275Z\"/></g><g class=\"ae-array\"><g style=\"--i:0\" transform=\"translate(800 390) rotate(0)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:1\" transform=\"translate(800 390) rotate(30)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:2\" transform=\"translate(800 390) rotate(60)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:3\" transform=\"translate(800 390) rotate(90)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:4\" transform=\"translate(800 390) rotate(120)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:5\" transform=\"translate(800 390) rotate(150)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:6\" transform=\"translate(800 390) rotate(180)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:7\" transform=\"translate(800 390) rotate(210)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:8\" transform=\"translate(800 390) rotate(240)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:9\" transform=\"translate(800 390) rotate(270)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:10\" transform=\"translate(800 390) rotate(300)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g><g style=\"--i:11\" transform=\"translate(800 390) rotate(330)\"><path class=\"facet\" d=\"M-18-140L-38-270L0-340L38-270L18-140L0-120Z\"/><path class=\"wire\" d=\"M0-340V-120M-38-270H38M-18-140L0-270L18-140\"/></g></g><g class=\"ae-wings\"><path style=\"--i:0\" class=\"facet\" d=\"M740 460L530 400L260 120L490 475Z M860 460L1070 400L1340 120L1110 475Z\"/><path style=\"--i:1\" class=\"facet\" d=\"M719 440L472 362L230 175L442 500Z M881 440L1128 362L1370 175L1158 500Z\"/><path style=\"--i:2\" class=\"facet\" d=\"M698 420L414 324L200 230L394 525Z M902 420L1186 324L1400 230L1206 525Z\"/><path style=\"--i:3\" class=\"facet\" d=\"M677 400L356 286L170 285L346 550Z M923 400L1244 286L1430 285L1254 550Z\"/><path style=\"--i:4\" class=\"facet\" d=\"M656 380L298 248L140 340L298 575Z M944 380L1302 248L1460 340L1302 575Z\"/><path style=\"--i:5\" class=\"facet\" d=\"M635 360L240 210L110 395L250 600Z M965 360L1360 210L1490 395L1350 600Z\"/><path style=\"--i:6\" class=\"facet\" d=\"M614 340L182 172L80 450L202 625Z M986 340L1418 172L1520 450L1398 625Z\"/></g><g class=\"ae-engine\"><path class=\"core\" d=\"M800 180L950 390L800 600L650 390Z\"/><path class=\"wire\" d=\"M800 180V600M650 390H950M800 245L905 390L800 535L695 390Z\"/></g><g class=\"ae-bridge\"><path class=\"facet\" style=\"--i:0\" d=\"M745 570L800 552L855 570L800 591Z\"/><path class=\"facet\" style=\"--i:1\" d=\"M741 597L800 579L859 597L800 618Z\"/><path class=\"facet\" style=\"--i:2\" d=\"M729 624L800 606L871 624L800 645Z\"/><path class=\"facet\" style=\"--i:3\" d=\"M709 651L800 633L891 651L800 672Z\"/><path class=\"facet\" style=\"--i:4\" d=\"M681 678L800 660L919 678L800 699Z\"/><path class=\"facet\" style=\"--i:5\" d=\"M645 705L800 687L955 705L800 726Z\"/><path class=\"facet\" style=\"--i:6\" d=\"M601 732L800 714L999 732L800 753Z\"/><path class=\"facet\" style=\"--i:7\" d=\"M549 759L800 741L1051 759L800 780Z\"/><path class=\"facet\" style=\"--i:8\" d=\"M489 786L800 768L1111 786L800 807Z\"/><path class=\"facet\" style=\"--i:9\" d=\"M421 813L800 795L1179 813L800 834Z\"/><path class=\"facet\" style=\"--i:10\" d=\"M345 840L800 822L1255 840L800 861Z\"/><path class=\"facet\" style=\"--i:11\" d=\"M261 867L800 849L1339 867L800 888Z\"/></g><g class=\"ae-spectrum\"><path style=\"--i:0\" d=\"M-100 680L510 580L800 270L1090 580L1700 120\"/><path style=\"--i:1\" d=\"M-100 690L510 568L800 292L1090 568L1700 165\"/><path style=\"--i:2\" d=\"M-100 700L510 556L800 314L1090 556L1700 210\"/><path style=\"--i:3\" d=\"M-100 710L510 544L800 336L1090 544L1700 255\"/><path style=\"--i:4\" d=\"M-100 720L510 532L800 358L1090 532L1700 300\"/><path style=\"--i:5\" d=\"M-100 730L510 520L800 380L1090 520L1700 345\"/><path style=\"--i:6\" d=\"M-100 740L510 508L800 402L1090 508L1700 390\"/><path style=\"--i:7\" d=\"M-100 750L510 496L800 424L1090 496L1700 435\"/><path style=\"--i:8\" d=\"M-100 760L510 484L800 446L1090 484L1700 480\"/></g></svg>"+(mode==='ultimate'?'<div class="fr9-caption"><small>AETHER</small><strong>Genesis · Khai Thiên Quang Giới</strong><span>Lăng kính thức tỉnh · Bình minh đầu tiên</span></div>':'');
            document.body.appendChild(node);return node;
        },
        realmUltimate(x,y) {
            if(this.realmLocked||document.hidden||!document.documentElement.classList.contains('aether-luminous-equipped'))return false;
            this.realmLocked=true;const node=this.realmScene('ultimate',x,y);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.realmLater(()=>node.remove(),reduced?1400:8600);this.realmLater(()=>{this.realmLocked=false;},reduced?1800:9100);return true;
        },

        activePetElement: null,
        petClickHandler: null,
        petPointerDownHandler: null,
        petPointerUpHandler: null,
        petKeyHandler: null,
        petPointerState: null,
        documentPointerHandler: null,
        timers: new Set(),
        skillLocked: false,

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.mythic-aether-luminous-magic, ' +
                '#virtual-pet-container #virtual-pet-img.aether-mythic-avatar'
            );
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.clearRealmScene();
            const oldPet = this.activePetElement;
            if (oldPet) {
                if (this.petClickHandler) {
                    oldPet.removeEventListener('click', this.petClickHandler);
                }
                if (this.petPointerDownHandler) {
                    oldPet.removeEventListener('pointerdown', this.petPointerDownHandler);
                }
                if (this.petPointerUpHandler) {
                    oldPet.removeEventListener('pointerup', this.petPointerUpHandler);
                }
                if (this.petKeyHandler) {
                    oldPet.removeEventListener('keydown', this.petKeyHandler);
                }
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            this.clearTimers();
            this.activePetElement = null;
            this.petClickHandler = null;
            this.petPointerDownHandler = null;
            this.petPointerUpHandler = null;
            this.petKeyHandler = null;
            this.petPointerState = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'aether-luminous-equipped',
                'aether-luminous-skill-active'
            );
            document.body?.classList.remove(
                'theme-aether-luminous-stage'
            );

            document
                .querySelectorAll(
                    '.aether-mythic-world,' +
                    '.aether-mythic-ui-frame,' +
                    '.aether-mythic-page-click,' +
                    '.aether-mythic-screen-burst,' +
                    '.aether-mythic-screen-dialogue'
                )
                .forEach(node => node.remove());

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-aether-mythic-stage',
                'aether-mythic-awakening',
                'aether-mythic-casting',
                'aether-mythic-pressed'
            );

            container
                ?.querySelectorAll('.aether-mythic-pet-realm')
                .forEach(node => node.remove());

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('aether-mythic-avatar');
        },

        createWorld() {
            document.querySelectorAll('.aether-mythic-world').forEach(n=>n.remove());
            document.documentElement.classList.add('fr9-aether-equipped');
            this.realmScene('world').classList.add('aether-mythic-world');
        },

        createInterface() {
            document.querySelectorAll('.aether-mythic-ui-frame').forEach(n=>n.remove());
            const n=document.createElement('div');n.className='fr9-aether fr9-interface aether-mythic-ui-frame';n.dataset.fiveRealm='aether';n.setAttribute('aria-hidden','true');
            n.innerHTML='<i></i><i></i><i></i><i></i>';document.body.appendChild(n);
        },

        createPetRealm() {
            const container = document.getElementById(
                'virtual-pet-container'
            );
            const pet = this.getPet() || container?.querySelector(
                '#virtual-pet-img'
            );

            if (!container || !pet) return false;

            container
                .querySelectorAll('.aether-mythic-pet-realm')
                .forEach(node => node.remove());

            pet.classList.add('aether-mythic-avatar');
            pet.setAttribute('draggable', 'false');
            pet.setAttribute('tabindex', '0');
            pet.setAttribute('role', 'button');
            pet.setAttribute('aria-label', 'Kích hoạt Thiên Quang Nguyên Sơ');
            container.classList.add(
                'pet-aether-mythic-stage',
                'aether-mythic-awakening'
            );

            const realm = document.createElement('div');
            realm.className = 'aether-mythic-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.dataset.luxuryQualityLayer="1";
            realm.innerHTML = `
                <span class="aether-local-sanctum"></span>
                <span class="aether-local-aura aura-back"></span>
                <span class="aether-local-aura aura-front"></span>
                <span class="aether-local-halo"></span>
                <span class="aether-local-crown">✦</span>
                <span class="aether-local-ring ring-a"></span>
                <span class="aether-local-ring ring-b"></span>
                <span class="aether-local-ring ring-c"></span>
                <span class="aether-local-ring ring-d"></span>
                <span class="aether-local-sigil sigil-a"></span>
                <span class="aether-local-sigil sigil-b"></span>
                <span class="aether-local-wing wing-left"></span>
                <span class="aether-local-wing wing-right"></span>
                <span class="aether-local-ribbon ribbon-a"></span>
                <span class="aether-local-ribbon ribbon-b"></span>
                <div class="aether-local-runes"></div>
                <div class="aether-local-feathers"></div>
                <div class="aether-local-stars"></div>
                <span class="aether-local-ground"></span>
                <span class="aether-local-ground-ring ground-a"></span>
                <span class="aether-local-ground-ring ground-b"></span>
            `;

            const stars = realm.querySelector('.aether-local-stars');
            const starCount = getLuxuryQualityCount(24);
            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.textContent = index % 4 === 0 ? '✦' : '·';
                star.style.setProperty('--aether-local-angle', `${index * (360 / starCount)}deg`);
                star.style.setProperty('--aether-local-delay', `${-index * .13}s`);
                star.style.setProperty('--aether-local-radius', `${92 + (index % 4) * 14}px`);
                stars?.appendChild(star);
            }

            const runes = realm.querySelector('.aether-local-runes');
            const runeChars = ['✦', '✧', '◇', '⋆', '✶', '✷', '✹', '✺', '✦', '◇'];
            runeChars.forEach((char, index) => {
                const rune = document.createElement('i');
                rune.textContent = char;
                rune.style.setProperty('--aether-rune-angle', `${index * 36}deg`);
                rune.style.setProperty('--aether-rune-delay', `${-index * .21}s`);
                runes?.appendChild(rune);
            });

            const feathers = realm.querySelector('.aether-local-feathers');
            const featherCount = getLuxuryQualityCount(12);
            for (let index = 0; index < featherCount; index++) {
                const feather = document.createElement('i');
                feather.style.setProperty('--aether-local-feather-angle', `${index * (360 / featherCount)}deg`);
                feather.style.setProperty('--aether-local-feather-delay', `${-index * .17}s`);
                feathers?.appendChild(feather);
            }

            container.insertBefore(realm, pet);
            return true;
        },

        createPageClick(x,y) {if(!document.documentElement.classList.contains('aether-luminous-equipped'))return;return luxuryTapBloom11(this,'aether',x,y);
        },

        installGlobalClick() {installLuxuryGestures10(this,'aether','aether-luminous-equipped',(x,y)=>this.createPageClick(x,y));
        },

        triggerUltimate(x,y) { return this.realmUltimate(x,y); },

        installPetSkill() {
            const pet=this.getPet?.()||document.querySelector('#virtual-pet-img');const container=pet?.closest('#virtual-pet-container');if(!pet||!container)return false;
            if(this.realmPet===pet)return true;
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            this.realmPet=pet;this.activePetElement=pet;
            this.realmAttrs=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',"Genesis · Khai Thiên Quang Giới");
            this.realmClick=e=>{
                if(!document.documentElement.classList.contains('aether-luminous-equipped')||container.dataset.petDragged==='1'||(typeof PetInteractionManager!=='undefined'&&PetInteractionManager.isPetDragging))return;
                e.preventDefault();e.stopImmediatePropagation();e.__nyxUltimateHandled=true;
                const rect=pet.getBoundingClientRect();this.realmUltimate(rect.x+rect.width/2,rect.y+rect.height/2);
            };
            this.realmKey=e=>{if(e.key==='Enter'||e.key===' '){this.realmClick(e);}};
            pet.addEventListener('click',this.realmClick,true);pet.addEventListener('keydown',this.realmKey);
            this.realmAbort?.abort();this.realmAbort=new AbortController();
            document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-five-realm="aether"]').forEach(n=>n.classList.toggle('fr9-paused',document.hidden)),{signal:this.realmAbort.signal});
            this.realmObserver?.disconnect();this.realmObserver=new MutationObserver(()=>{if(!pet.isConnected||container.hidden||container.style.display==='none')this.clear();});
            this.realmObserver.observe(container.parentNode,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
            return true;
        },

        repair() {
            if (!document.documentElement.classList.contains(
                'aether-luminous-equipped'
            )) return;

            if (!document.querySelector('.aether-mythic-world')) {
                this.createWorld();
            }
            if (!document.querySelector('.aether-mythic-ui-frame')) {
                this.createInterface();
            }
            if (
                !document.querySelector(
                    '#virtual-pet-container .aether-mythic-pet-realm'
                )
            ) {
                this.createPetRealm();
            }
            if (!this.activePetElement || !this.activePetElement.isConnected) {
                if (this.activePetElement && this.petClickHandler) {
                    this.activePetElement.removeEventListener('click', this.petClickHandler);
                    if (this.petPointerDownHandler) this.activePetElement.removeEventListener('pointerdown', this.petPointerDownHandler);
                    if (this.petPointerUpHandler) this.activePetElement.removeEventListener('pointerup', this.petPointerUpHandler);
                    if (this.petKeyHandler) this.activePetElement.removeEventListener('keydown', this.petKeyHandler);
                }
                this.activePetElement = null;
                this.petClickHandler = null;
                this.petPointerDownHandler = null;
                this.petPointerUpHandler = null;
                this.petKeyHandler = null;
                this.installPetSkill();
            }
        },

        mount() {
            this.clear();
            ensureAetherStylesheet();

            document.documentElement.classList.add(
                'aether-luminous-equipped'
            );
            document.body?.classList.add(
                'theme-aether-luminous-stage'
            );

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();

            [120, 420, 900, 1600].forEach(delay => {
                this.setTimer(() => this.repair(), delay);
            });

            return true;
        }
    };

    // ========================================================
    // NYX · CSS LAZY GUARD
    // - Không tải ở startup nếu NYX không cần.
    // - Chỉ tải khi card NYX cần hiển thị hoặc NYX được mount.
    // - Tránh card rơi về nền trắng khi selective loader đã bỏ
    //   ALL_SPECIAL_STORE_CSS khỏi store-ui.
    // ========================================================
    function ensureNyxStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).find(link =>
            /(?:^|\/)nyx-than-thoai(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'nyx-mythic-premium-style';
            return existing;
        }

        if (document.getElementById('nyx-mythic-premium-style')) {
            return document.getElementById('nyx-mythic-premium-style');
        }

        let href = '';

        if (window.NYX_MYTHIC_CSS_PATH) {
            href = String(window.NYX_MYTHIC_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/nyx-than-thoai.css?v=20260927.realms10',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/nyx-than-thoai.css?v=20260927.realms10',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'nyx-mythic-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.nyxMythic = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[NYX] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/nyx-than-thoai.css?v=20260927.five-realms-v9 hoặc gán window.NYX_MYTHIC_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }

    // ========================================================
    // NYX · HẮC DẠ NGUYÊN SƠ — FULL PREMIUM SUITE V2
    // WORLD + INTERFACE + GLOBAL CLICK + SCREEN SKILL
    // Pet Realm + ultimate gốc vẫn do PetManager quản lý.
    // Namespace độc lập: nyx-mythic-*
    // ========================================================
    const LuxuryNyxRuntime = {
        realmTimers: new Set(), realmLocked: false, realmLastClick: -1000,
        realmLater(fn,ms) { const timer=setTimeout(()=>{this.realmTimers.delete(timer);fn();},ms);this.realmTimers.add(timer);return timer; },
        clearRealmScene() {
            this.realmTimers.forEach(clearTimeout);this.realmTimers.clear();this.realmLocked=false;this.realmLastClick=-1000;
            this.realmAbort?.abort();this.realmObserver?.disconnect();
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            for(const [key,value] of Object.entries(this.realmAttrs||{})){if(value===null)this.realmPet?.removeAttribute(key);else this.realmPet?.setAttribute(key,value);}
            this.realmPet=null;this.realmAttrs=null;
            document.querySelectorAll('[data-five-realm="nyx"]').forEach(n=>n.remove());
            document.documentElement.classList.remove('fr9-nyx-equipped');
        },
        realmScene(mode,x=innerWidth/2,y=innerHeight/2) {
            const node=document.createElement('div');node.className='fr9-nyx fr9-scene fr9-'+mode;node.dataset.fiveRealm='nyx';node.setAttribute('aria-hidden','true');
            node.style.setProperty('--impact-x',x+'px');node.style.setProperty('--impact-y',y+'px');
            node.innerHTML="<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><g class=\"nx-curtain\"><path style=\"--i:0\" d=\"M-100-30Q130 240 -60 470T90 990L190 990Q40 650 150 470T30-30Z\"/><path style=\"--i:1\" d=\"M50-30Q280 240 90 470T240 990L340 990Q190 650 300 470T180-30Z\"/><path style=\"--i:2\" d=\"M200-30Q430 240 240 470T390 990L490 990Q340 650 450 470T330-30Z\"/><path style=\"--i:3\" d=\"M350-30Q580 240 390 470T540 990L640 990Q490 650 600 470T480-30Z\"/><path style=\"--i:4\" d=\"M500-30Q730 240 540 470T690 990L790 990Q640 650 750 470T630-30Z\"/><path style=\"--i:5\" d=\"M650-30Q880 240 690 470T840 990L940 990Q790 650 900 470T780-30Z\"/><path style=\"--i:6\" d=\"M800-30Q1030 240 840 470T990 990L1090 990Q940 650 1050 470T930-30Z\"/><path style=\"--i:7\" d=\"M950-30Q1180 240 990 470T1140 990L1240 990Q1090 650 1200 470T1080-30Z\"/><path style=\"--i:8\" d=\"M1100-30Q1330 240 1140 470T1290 990L1390 990Q1240 650 1350 470T1230-30Z\"/><path style=\"--i:9\" d=\"M1250-30Q1480 240 1290 470T1440 990L1540 990Q1390 650 1500 470T1380-30Z\"/><path style=\"--i:10\" d=\"M1400-30Q1630 240 1440 470T1590 990L1690 990Q1540 650 1650 470T1530-30Z\"/><path style=\"--i:11\" d=\"M1550-30Q1780 240 1590 470T1740 990L1840 990Q1690 650 1800 470T1680-30Z\"/></g><g class=\"nx-eclipse\"><circle class=\"corona\" cx=\"800\" cy=\"370\" r=\"260\"/><circle class=\"void\" cx=\"815\" cy=\"354\" r=\"245\"/><path class=\"wire\" d=\"M527 370A273 273 0 1 0 1073 370\"/></g><g class=\"nx-crown\"><path style=\"--i:0\" class=\"obsidian\" d=\"M425 740L410 565L450 380L490 565L475 740Z\"/><path style=\"--i:1\" class=\"obsidian\" d=\"M512.5 740L497.5 515.2511537925384L537.5 330.25115379253833L577.5 515.2511537925384L562.5 740Z\"/><path style=\"--i:2\" class=\"obsidian\" d=\"M600 740L585 473.0761184457488L625 288.0761184457488L665 473.0761184457488L650 740Z\"/><path style=\"--i:3\" class=\"obsidian\" d=\"M687.5 740L672.5 444.8956607735327L712.5 259.8956607735327L752.5 444.8956607735327L737.5 740Z\"/><path style=\"--i:4\" class=\"obsidian\" d=\"M775 740L760 435L800 250L840 435L825 740Z\"/><path style=\"--i:5\" class=\"obsidian\" d=\"M862.5 740L847.5 444.8956607735327L887.5 259.8956607735327L927.5 444.8956607735327L912.5 740Z\"/><path style=\"--i:6\" class=\"obsidian\" d=\"M950 740L935 473.0761184457488L975 288.0761184457488L1015 473.0761184457488L1000 740Z\"/><path style=\"--i:7\" class=\"obsidian\" d=\"M1037.5 740L1022.5 515.2511537925384L1062.5 330.25115379253833L1102.5 515.2511537925384L1087.5 740Z\"/><path style=\"--i:8\" class=\"obsidian\" d=\"M1125 740L1110 565L1150 380L1190 565L1175 740Z\"/></g><g class=\"nx-web\"><path style=\"--i:0\" d=\"M80 0L210 160L90 300L240 450\"/><circle cx=\"210\" cy=\"160\" r=\"3\"/><circle cx=\"90\" cy=\"300\" r=\"2\"/><path style=\"--i:1\" d=\"M234 0L325 160L232 300L343 450\"/><circle cx=\"325\" cy=\"160\" r=\"3\"/><circle cx=\"232\" cy=\"300\" r=\"2\"/><path style=\"--i:2\" d=\"M388 0L440 160L374 300L446 450\"/><circle cx=\"440\" cy=\"160\" r=\"3\"/><circle cx=\"374\" cy=\"300\" r=\"2\"/><path style=\"--i:3\" d=\"M542 0L555 160L516 300L549 450\"/><circle cx=\"555\" cy=\"160\" r=\"3\"/><circle cx=\"516\" cy=\"300\" r=\"2\"/><path style=\"--i:4\" d=\"M696 0L670 160L658 300L652 450\"/><circle cx=\"670\" cy=\"160\" r=\"3\"/><circle cx=\"658\" cy=\"300\" r=\"2\"/><path style=\"--i:5\" d=\"M850 0L785 160L800 300L755 450\"/><circle cx=\"785\" cy=\"160\" r=\"3\"/><circle cx=\"800\" cy=\"300\" r=\"2\"/><path style=\"--i:6\" d=\"M1004 0L900 160L942 300L858 450\"/><circle cx=\"900\" cy=\"160\" r=\"3\"/><circle cx=\"942\" cy=\"300\" r=\"2\"/><path style=\"--i:7\" d=\"M1158 0L1015 160L1084 300L961 450\"/><circle cx=\"1015\" cy=\"160\" r=\"3\"/><circle cx=\"1084\" cy=\"300\" r=\"2\"/><path style=\"--i:8\" d=\"M1312 0L1130 160L1226 300L1064 450\"/><circle cx=\"1130\" cy=\"160\" r=\"3\"/><circle cx=\"1226\" cy=\"300\" r=\"2\"/><path style=\"--i:9\" d=\"M1466 0L1245 160L1368 300L1167 450\"/><circle cx=\"1245\" cy=\"160\" r=\"3\"/><circle cx=\"1368\" cy=\"300\" r=\"2\"/></g><g class=\"nx-tide\"><ellipse style=\"--i:0\" cx=\"800\" cy=\"770\" rx=\"180\" ry=\"12\"/><ellipse style=\"--i:1\" cx=\"800\" cy=\"770\" rx=\"270\" ry=\"27\"/><ellipse style=\"--i:2\" cx=\"800\" cy=\"770\" rx=\"360\" ry=\"42\"/><ellipse style=\"--i:3\" cx=\"800\" cy=\"770\" rx=\"450\" ry=\"57\"/><ellipse style=\"--i:4\" cx=\"800\" cy=\"770\" rx=\"540\" ry=\"72\"/><ellipse style=\"--i:5\" cx=\"800\" cy=\"770\" rx=\"630\" ry=\"87\"/><ellipse style=\"--i:6\" cx=\"800\" cy=\"770\" rx=\"720\" ry=\"102\"/><ellipse style=\"--i:7\" cx=\"800\" cy=\"770\" rx=\"810\" ry=\"117\"/></g><g class=\"nx-rift\"><path d=\"M-90 470Q350 750 800 470T1690 470\"/><path d=\"M-90 490Q350 770 800 490T1690 490\"/></g></svg>"+(mode==='ultimate'?'<div class="fr9-caption"><small>NYX</small><strong>Vĩnh Dạ · Vương Miện Hư Không</strong><span>Tinh tú lặng im · Màn đêm lên ngôi</span></div>':'');
            document.body.appendChild(node);return node;
        },
        realmUltimate(x,y) {
            if(this.realmLocked||document.hidden||!document.documentElement.classList.contains('nyx-first-night-equipped'))return false;
            this.realmLocked=true;const node=this.realmScene('ultimate',x,y);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.realmLater(()=>node.remove(),reduced?1400:8600);this.realmLater(()=>{this.realmLocked=false;},reduced?1800:9100);return true;
        },

        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        skillLocked: false,

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.clearRealmScene();
            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'nyx-first-night-equipped'
            );

            document.body?.classList.remove(
                'theme-nyx-first-night'
            );

            document
                .querySelectorAll(
                    '.nyx-mythic-world-v2,' +
                    '.nyx-mythic-ui-frame-v2,' +
                    '.nyx-mythic-page-click,' +
                    '.nyx-mythic-screen-burst-v2,' +
                    '.nyx-mythic-screen-dialogue-v2'
                )
                .forEach(element => element.remove());
        },

        createWorld() {
            document.querySelectorAll('.nyx-mythic-world-v2').forEach(n=>n.remove());
            document.documentElement.classList.add('fr9-nyx-equipped');
            this.realmScene('world').classList.add('nyx-mythic-world-v2');
        },

        createInterface() {
            document.querySelectorAll('.nyx-mythic-ui-frame-v2').forEach(n=>n.remove());
            const n=document.createElement('div');n.className='fr9-nyx fr9-interface nyx-mythic-ui-frame-v2';n.dataset.fiveRealm='nyx';n.setAttribute('aria-hidden','true');
            n.innerHTML='<i></i><i></i><i></i><i></i>';document.body.appendChild(n);
        },

        createPageClick(x,y) {if(!document.documentElement.classList.contains('nyx-first-night-equipped'))return;return luxuryTapBloom11(this,'nyx',x,y);
        },

        installGlobalClickEffect() {installLuxuryGestures10(this,'nyx','nyx-first-night-equipped',(x,y)=>this.createPageClick(x,y));
        },

        createScreenBurst(x,y) { return this.realmUltimate(x,y); },

        installPetSkill() {
            const pet=this.getPet?.()||document.querySelector('#virtual-pet-img');const container=pet?.closest('#virtual-pet-container');if(!pet||!container)return false;
            if(this.realmPet===pet)return true;
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            this.realmPet=pet;this.activePetElement=pet;
            this.realmAttrs=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',"Vĩnh Dạ · Vương Miện Hư Không");
            this.realmClick=e=>{
                if(!document.documentElement.classList.contains('nyx-first-night-equipped')||container.dataset.petDragged==='1'||(typeof PetInteractionManager!=='undefined'&&PetInteractionManager.isPetDragging))return;
                e.preventDefault();e.stopImmediatePropagation();e.__nyxUltimateHandled=true;
                const rect=pet.getBoundingClientRect();this.realmUltimate(rect.x+rect.width/2,rect.y+rect.height/2);
            };
            this.realmKey=e=>{if(e.key==='Enter'||e.key===' '){this.realmClick(e);}};
            pet.addEventListener('click',this.realmClick,true);pet.addEventListener('keydown',this.realmKey);
            this.realmAbort?.abort();this.realmAbort=new AbortController();
            document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-five-realm="nyx"]').forEach(n=>n.classList.toggle('fr9-paused',document.hidden)),{signal:this.realmAbort.signal});
            this.realmObserver?.disconnect();this.realmObserver=new MutationObserver(()=>{if(!pet.isConnected||container.hidden||container.style.display==='none')this.clear();});
            this.realmObserver.observe(container.parentNode,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
            return true;
        },

        mount() {
            this.clear();
            ensureNyxStylesheet();

            document.documentElement.classList.add(
                'nyx-first-night-equipped'
            );
            document.body?.classList.add(
                'theme-nyx-first-night'
            );

            this.createWorld();
            this.createInterface();
            this.installGlobalClickEffect();
            this.installPetSkill();
        }
    };


    // ========================================================
    // ĐÊM ĐẦY SAO · ONE-CSS RUNTIME GUARD
    // ========================================================
    function ensureStarryNightStylesheet() {
        const existing = Array.from(
            document.querySelectorAll('link[rel="stylesheet"][href]')
        ).find(link =>
            /(?:^|\/)dem-day-sao(?:\(\d+\))?\.css(?:[?#].*)?$/i
                .test(link.href || '')
        );

        if (existing) {
            existing.id = existing.id || 'starry-night-premium-style';
            return existing;
        }

        const byId = document.getElementById('starry-night-premium-style');
        if (byId) return byId;

        let href = '';

        if (window.STARRY_NIGHT_CSS_PATH) {
            href = String(window.STARRY_NIGHT_CSS_PATH).trim();
        }

        if (!href) {
            const scripts = Array.from(document.scripts || []);
            const ownScript = scripts
                .slice()
                .reverse()
                .find(script =>
                    /(?:^|\/)luxury-store(?:[^\/]*)?\.js(?:[?#].*)?$/i
                        .test(script.src || '')
                );

            if (ownScript?.src) {
                try {
                    href = new URL(
                        '../css/dem-day-sao.css?v=20260927.realms10',
                        ownScript.src
                    ).href;
                } catch (_) {
                    href = '';
                }
            }
        }

        if (!href) {
            href = new URL(
                'css/dem-day-sao.css?v=20260927.realms10',
                document.baseURI
            ).href;
        }

        const link = document.createElement('link');
        link.id = 'starry-night-premium-style';
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.starryNight = 'true';

        link.addEventListener('error', () => {
            console.error(
                '[StarryNight] Không tải được CSS:',
                link.href,
                'Hãy đặt file tại css/dem-day-sao.css?v=20260927.five-realms-v9 hoặc gán window.STARRY_NIGHT_CSS_PATH trước khi nạp luxury-store.js.'
            );
        }, { once: true });

        document.head.appendChild(link);
        return link;
    }


    // ========================================================
    // ĐÊM ĐẦY SAO · FULL PREMIUM SUITE V1
    // WORLD + INTERFACE + PET REALM + GLOBAL CLICK + ULTIMATE
    // Không dùng ThemeManager/EffectManager, không ghi active_theme/effect.
    // ========================================================
    const LuxuryStarryNightRuntime = {
        realmTimers: new Set(), realmLocked: false, realmLastClick: -1000,
        realmLater(fn,ms) { const timer=setTimeout(()=>{this.realmTimers.delete(timer);fn();},ms);this.realmTimers.add(timer);return timer; },
        clearRealmScene() {
            this.realmTimers.forEach(clearTimeout);this.realmTimers.clear();this.realmLocked=false;this.realmLastClick=-1000;
            this.realmAbort?.abort();this.realmObserver?.disconnect();
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            for(const [key,value] of Object.entries(this.realmAttrs||{})){if(value===null)this.realmPet?.removeAttribute(key);else this.realmPet?.setAttribute(key,value);}
            this.realmPet=null;this.realmAttrs=null;
            document.querySelectorAll('[data-five-realm="starry"]').forEach(n=>n.remove());
            document.documentElement.classList.remove('fr9-starry-equipped');
        },
        realmScene(mode,x=innerWidth/2,y=innerHeight/2) {
            const node=document.createElement('div');node.className='fr9-starry fr9-scene fr9-'+mode;node.dataset.fiveRealm='starry';node.setAttribute('aria-hidden','true');
            node.style.setProperty('--impact-x',x+'px');node.style.setProperty('--impact-y',y+'px');
            node.innerHTML="<svg viewBox=\"0 0 1600 900\" preserveAspectRatio=\"xMidYMid slice\" aria-hidden=\"true\"><g class=\"st-sky\"><path style=\"--i:0\" d=\"M-100 120C250 -140 510 630 800 230S1270 -140 1700 180\"/><path style=\"--i:1\" d=\"M-100 135C250 -121 510 618 800 236S1270 -125 1700 194\"/><path style=\"--i:2\" d=\"M-100 150C250 -102 510 606 800 242S1270 -110 1700 208\"/><path style=\"--i:3\" d=\"M-100 165C250 -83 510 594 800 248S1270 -95 1700 222\"/><path style=\"--i:4\" d=\"M-100 180C250 -64 510 582 800 254S1270 -80 1700 236\"/><path style=\"--i:5\" d=\"M-100 195C250 -45 510 570 800 260S1270 -65 1700 250\"/><path style=\"--i:6\" d=\"M-100 210C250 -26 510 558 800 266S1270 -50 1700 264\"/><path style=\"--i:7\" d=\"M-100 225C250 -7 510 546 800 272S1270 -35 1700 278\"/><path style=\"--i:8\" d=\"M-100 240C250 12 510 534 800 278S1270 -20 1700 292\"/><path style=\"--i:9\" d=\"M-100 255C250 31 510 522 800 284S1270 -5 1700 306\"/><path style=\"--i:10\" d=\"M-100 270C250 50 510 510 800 290S1270 10 1700 320\"/><path style=\"--i:11\" d=\"M-100 285C250 69 510 498 800 296S1270 25 1700 334\"/><path style=\"--i:12\" d=\"M-100 300C250 88 510 486 800 302S1270 40 1700 348\"/><path style=\"--i:13\" d=\"M-100 315C250 107 510 474 800 308S1270 55 1700 362\"/><path style=\"--i:14\" d=\"M-100 330C250 126 510 462 800 314S1270 70 1700 376\"/><path style=\"--i:15\" d=\"M-100 345C250 145 510 450 800 320S1270 85 1700 390\"/><path style=\"--i:16\" d=\"M-100 360C250 164 510 438 800 326S1270 100 1700 404\"/><path style=\"--i:17\" d=\"M-100 375C250 183 510 426 800 332S1270 115 1700 418\"/><path style=\"--i:18\" d=\"M-100 390C250 202 510 414 800 338S1270 130 1700 432\"/><path style=\"--i:19\" d=\"M-100 405C250 221 510 402 800 344S1270 145 1700 446\"/><path style=\"--i:20\" d=\"M-100 420C250 240 510 390 800 350S1270 160 1700 460\"/><path style=\"--i:21\" d=\"M-100 435C250 259 510 378 800 356S1270 175 1700 474\"/></g><g class=\"st-stars\"><g style=\"--i:0\" transform=\"translate(80 80)\"><circle r=\"18\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:1\" transform=\"translate(210 180)\"><circle r=\"25\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:2\" transform=\"translate(340 280)\"><circle r=\"32\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:3\" transform=\"translate(470 80)\"><circle r=\"39\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:4\" transform=\"translate(600 180)\"><circle r=\"18\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:5\" transform=\"translate(730 280)\"><circle r=\"25\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:6\" transform=\"translate(860 80)\"><circle r=\"32\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:7\" transform=\"translate(990 180)\"><circle r=\"39\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:8\" transform=\"translate(1120 280)\"><circle r=\"18\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:9\" transform=\"translate(1250 80)\"><circle r=\"25\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:10\" transform=\"translate(1380 180)\"><circle r=\"32\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g><g style=\"--i:11\" transform=\"translate(1510 280)\"><circle r=\"39\"/><path d=\"M-40 0H40M0-40V40M-27-27L27 27M-27 27L27-27\"/></g></g><g class=\"st-hills\"><path d=\"M-100 720Q120 330 360 560Q650 340 840 590Q1170 330 1700 620V1000H-100Z\"/><path d=\"M-100 800Q270 490 540 680Q850 450 1100 680Q1400 490 1700 750V1000H-100Z\"/></g><g class=\"st-town\"><g style=\"--i:0\" transform=\"translate(-50 630)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:1\" transform=\"translate(50 664)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:2\" transform=\"translate(150 698)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:3\" transform=\"translate(250 732)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:4\" transform=\"translate(350 630)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:5\" transform=\"translate(450 664)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:6\" transform=\"translate(550 698)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:7\" transform=\"translate(650 732)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:8\" transform=\"translate(750 630)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:9\" transform=\"translate(850 664)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:10\" transform=\"translate(950 698)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:11\" transform=\"translate(1050 732)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:12\" transform=\"translate(1150 630)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:13\" transform=\"translate(1250 664)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:14\" transform=\"translate(1350 698)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:15\" transform=\"translate(1450 732)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g><g style=\"--i:16\" transform=\"translate(1550 630)\"><path class=\"house\" d=\"M0 140V0L40-38L85 0V140Z\"/><path class=\"roof\" d=\"M-8 5L40-45L93 5L82 14L40-26L3 14Z\"/><path class=\"window\" d=\"M15 28H30V53H15ZM53 28H68V53H53ZM15 75H30V100H15ZM53 75H68V100H53Z\"/></g></g><g class=\"st-tower\"><path class=\"house\" d=\"M1070 800V430H1090V320L1130 160L1170 320V430H1190V800Z\"/><path class=\"roof\" d=\"M1080 330L1130 150L1180 330Z\"/><circle cx=\"1130\" cy=\"460\" r=\"30\"/><path class=\"hand\" d=\"M1130 438V460L1148 470\"/></g><g class=\"st-cypress\"><path d=\"M80 900Q-10 680 95 550Q10 460 130 290Q100 170 180 40Q210 240 190 300Q310 420 230 500Q340 670 270 900Z\"/></g><g class=\"st-brush\"><path style=\"--i:0\" d=\"M-100 760Q500 270 850 610T1740 250\"/><path style=\"--i:1\" d=\"M-100 769Q500 289 850 619T1740 262\"/><path style=\"--i:2\" d=\"M-100 778Q500 308 850 628T1740 274\"/><path style=\"--i:3\" d=\"M-100 787Q500 327 850 637T1740 286\"/><path style=\"--i:4\" d=\"M-100 796Q500 346 850 646T1740 298\"/><path style=\"--i:5\" d=\"M-100 805Q500 365 850 655T1740 310\"/><path style=\"--i:6\" d=\"M-100 814Q500 384 850 664T1740 322\"/><path style=\"--i:7\" d=\"M-100 823Q500 403 850 673T1740 334\"/><path style=\"--i:8\" d=\"M-100 832Q500 422 850 682T1740 346\"/><path style=\"--i:9\" d=\"M-100 841Q500 441 850 691T1740 358\"/><path style=\"--i:10\" d=\"M-100 850Q500 460 850 700T1740 370\"/></g></svg>"+(mode==='ultimate'?'<div class="fr9-caption"><small>TINH DẠ</small><strong>Tinh Dạ · Thành Phố Trong Tranh</strong><span>Một nét cọ · Đánh thức ngàn vì sao</span></div>':'');
            document.body.appendChild(node);return node;
        },
        realmUltimate(x,y) {
            if(this.realmLocked||document.hidden||!document.documentElement.classList.contains('starry-night-equipped'))return false;
            this.realmLocked=true;const node=this.realmScene('ultimate',x,y);const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            this.realmLater(()=>node.remove(),reduced?1400:8600);this.realmLater(()=>{this.realmLocked=false;},reduced?1800:9100);return true;
        },

        activePetElement: null,
        petClickHandler: null,
        documentPointerHandler: null,
        observer: null,
        skillLocked: false,
        timers: new Set(),

        setTimer(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        },

        clearTimers() {
            this.timers.forEach(timer => window.clearTimeout(timer));
            this.timers.clear();
        },

        getPet() {
            return document.querySelector(
                '#virtual-pet-container #virtual-pet-img.starry-night-van-gogh-magic,' +
                '#virtual-pet-container #virtual-pet-img.starry-night-avatar'
            );
        },

        promoteStylesheetPriority() {
            const link = ensureStarryNightStylesheet();
            if (link?.parentNode === document.head) {
                document.head.appendChild(link);
            }
            return link;
        },

        clear() {
            this.lastSmallTap12=-1000;
            clearLuxuryGestures10(this);
            this.clearRealmScene();
            this.clearTimers();

            if (this.activePetElement && this.petClickHandler) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            if (this.documentPointerHandler) {
                document.removeEventListener(
                    'pointerdown',
                    this.documentPointerHandler,
                    true
                );
            }

            if (this.observer) {
                this.observer.disconnect();
                this.observer = null;
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.documentPointerHandler = null;
            this.skillLocked = false;

            document.documentElement.classList.remove(
                'starry-night-equipped',
                'starry-night-skill-active'
            );

            document.body?.classList.remove(
                'theme-starry-night-canvas'
            );

            const container = document.getElementById(
                'virtual-pet-container'
            );

            container?.classList.remove(
                'pet-starry-night-stage',
                'starry-night-casting'
            );

            if (container?.dataset) {
                delete container.dataset.starryNightClickLocked;
            }

            container
                ?.querySelector('#virtual-pet-img')
                ?.classList.remove('starry-night-avatar');

            document
                .querySelectorAll(
                    '.snv-world,' +
                    '.snv-ui-frame,' +
                    '.snv-pet-realm,' +
                    '.snv-page-click,' +
                    '.snv-ultimate,' +
                    '.snv-dialogue'
                )
                .forEach(element => element.remove());
        },

        createWorld() {
            document.querySelectorAll('.snv-world').forEach(n=>n.remove());
            document.documentElement.classList.add('fr9-starry-equipped');
            this.realmScene('world').classList.add('snv-world');
        },

        createInterface() {
            document.querySelectorAll('.snv-ui-frame').forEach(n=>n.remove());
            const n=document.createElement('div');n.className='fr9-starry fr9-interface snv-ui-frame';n.dataset.fiveRealm='starry';n.setAttribute('aria-hidden','true');
            n.innerHTML='<i></i><i></i><i></i><i></i>';document.body.appendChild(n);
        },

        createPetRealm() {
            const container = document.getElementById('virtual-pet-container');
            const pet = this.getPet();

            if (!container || !pet) return false;

            container
                .querySelectorAll('.snv-pet-realm')
                .forEach(element => element.remove());

            container.classList.add('pet-starry-night-stage');
            pet.classList.add('starry-night-avatar');
            pet.setAttribute('draggable', 'false');

            const realm = document.createElement('div');
            realm.className = 'snv-pet-realm';
            realm.setAttribute('aria-hidden', 'true');
            realm.dataset.luxuryQualityLayer="1";
            realm.innerHTML = `
                <span class="snv-pet-halo-outer"></span>
                <span class="snv-pet-halo"></span>
                <span class="snv-pet-swirl"></span>
                <span class="snv-pet-swirl-b"></span>
                <span class="snv-pet-moon"></span>
                <span class="snv-pet-cypress"></span>
                <div class="snv-pet-star-field"></div>
                <span class="snv-pet-ground"></span>
            `;

            const starField = realm.querySelector('.snv-pet-star-field');
            const starCount = getLuxuryQualityCount(30);

            for (let index = 0; index < starCount; index++) {
                const star = document.createElement('i');
                star.className = 'snv-pet-star';
                star.style.setProperty('--snv-psx', `${(index * 43 + 7) % 92}%`);
                star.style.setProperty('--snv-psy', `${(index * 61 + 3) % 80}%`);
                star.style.setProperty('--snv-pss', `${2 + (index % 4) * 1.2}px`);
                star.style.setProperty('--snv-psd', `${-(index % 9) * .28}s`);
                starField?.appendChild(star);
            }

            container.insertBefore(realm, pet);
            return true;
        },

        createPageClick(x,y) {if(!document.documentElement.classList.contains('starry-night-equipped'))return;return luxuryTapBloom11(this,'starry',x,y);
        },

        installGlobalClick() {installLuxuryGestures10(this,'starry','starry-night-equipped',(x,y)=>this.createPageClick(x,y));
        },

        createUltimate(x,y) { return this.realmUltimate(x,y); },

        installPetSkill() {
            const pet=this.getPet?.()||document.querySelector('#virtual-pet-img');const container=pet?.closest('#virtual-pet-container');if(!pet||!container)return false;
            if(this.realmPet===pet)return true;
            if(this.realmPet&&this.realmClick){this.realmPet.removeEventListener('click',this.realmClick,true);this.realmPet.removeEventListener('keydown',this.realmKey);}
            this.realmPet=pet;this.activePetElement=pet;
            this.realmAttrs=Object.fromEntries(['tabindex','role','aria-label'].map(k=>[k,pet.getAttribute(k)]));pet.tabIndex=0;pet.setAttribute('role','button');pet.setAttribute('aria-label',"Tinh Dạ · Thành Phố Trong Tranh");
            this.realmClick=e=>{
                if(!document.documentElement.classList.contains('starry-night-equipped')||container.dataset.petDragged==='1'||(typeof PetInteractionManager!=='undefined'&&PetInteractionManager.isPetDragging))return;
                e.preventDefault();e.stopImmediatePropagation();e.__nyxUltimateHandled=true;
                const rect=pet.getBoundingClientRect();this.realmUltimate(rect.x+rect.width/2,rect.y+rect.height/2);
            };
            this.realmKey=e=>{if(e.key==='Enter'||e.key===' '){this.realmClick(e);}};
            pet.addEventListener('click',this.realmClick,true);pet.addEventListener('keydown',this.realmKey);
            this.realmAbort?.abort();this.realmAbort=new AbortController();
            document.addEventListener('visibilitychange',()=>document.querySelectorAll('[data-five-realm="starry"]').forEach(n=>n.classList.toggle('fr9-paused',document.hidden)),{signal:this.realmAbort.signal});
            this.realmObserver?.disconnect();this.realmObserver=new MutationObserver(()=>{if(!pet.isConnected||container.hidden||container.style.display==='none')this.clear();});
            this.realmObserver.observe(container.parentNode,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','style']});
            return true;
        },

        installObserver() {
            const container = document.getElementById('virtual-pet-container');
            if (!container) return;

            if (this.observer) this.observer.disconnect();

            this.observer = new MutationObserver(() => {
                if (!document.documentElement.classList.contains('starry-night-equipped')) {
                    return;
                }

                const activePetId = String(localStorage.getItem('active_pet') || '');
                if (activePetId && activePetId !== STARRY_NIGHT_PREMIUM_PET.id) {
                    this.clear();
                    return;
                }

                if (!this.getPet()) {
                    this.clear();
                }
            });

            this.observer.observe(container, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style', 'src']
            });
        },

        repair() {
            if (!document.documentElement.classList.contains('starry-night-equipped')) {
                return false;
            }

            this.promoteStylesheetPriority();

            if (!document.querySelector('.snv-world')) {
                this.createWorld();
            }

            if (!document.querySelector('.snv-ui-frame')) {
                this.createInterface();
            }

            if (this.getPet()) {
                if (!document.querySelector('#virtual-pet-container .snv-pet-realm')) {
                    this.createPetRealm();
                }

                if (this.activePetElement !== this.getPet()) {
                    this.installPetSkill();
                }
            }

            return true;
        },

        mount() {
            this.clear();
            this.promoteStylesheetPriority();

            document.documentElement.classList.add('starry-night-equipped');
            document.body?.classList.add('theme-starry-night-canvas');

            this.createWorld();
            this.createInterface();
            this.createPetRealm();
            this.installGlobalClick();
            this.installPetSkill();
            this.installObserver();

            [140, 520, 1200].forEach(delay => {
                this.setTimer(() => this.repair(), delay);
            });

            return true;
        },

        restore(attempt = 0) {
            ensureStarryNightStylesheet();

            const activePetId = String(localStorage.getItem('active_pet') || '');
            const pet = document.querySelector('#virtual-pet-container #virtual-pet-img');
            const source = String(pet?.getAttribute('src') || '');

            const looksActive =
                activePetId === STARRY_NIGHT_PREMIUM_PET.id ||
                pet?.classList.contains('starry-night-van-gogh-magic') ||
                source.includes('/Premium/đêm đầy sao/nam_nham_vat1.png');

            if (!looksActive) return false;

            if (pet) {
                this.mount();
                return true;
            }

            if (attempt < 10) {
                this.setTimer(
                    () => this.restore(attempt + 1),
                    180 + attempt * 60
                );
            }

            return false;
        }
    };

    // ========================================================
    // XUÂN THẦN · VẠN SINH HOA MỘNG
    // RUNTIME HIỆU ỨNG LUXURY V3
    // ========================================================

    const LuxurySpringRuntime = {
        activePetElement: null,
        petClickHandler: null,
        skillLocked: false,

        clear() {

            // ========================================================
            // DỌN TƯƠNG TÁC RIÊNG CỦA XUÂN THẦN
            // ========================================================

            if (
                this.activePetElement &&
                this.petClickHandler
            ) {
                this.activePetElement.removeEventListener(
                    'click',
                    this.petClickHandler
                );
            }

            this.activePetElement = null;
            this.petClickHandler = null;
            this.skillLocked = false;

            document
                .querySelectorAll(
                    '.spring-crown-screen-burst,' +
                    '.spring-goddess-divine-world,' +
                    '.spring-goddess-skill-impact,' +
                    '.spring-goddess-dialogue-box,' +
                    '.spring-crown-pet-burst-v3'
                )
                .forEach(el => el.remove());

            // EFFECT TOÀN WEB
            document
                .querySelectorAll(
                    '.premium-spring-world.spring-crown-world-v3'
                )
                .forEach(el => el.remove());

            // GIAO DIỆN
            document
                .querySelectorAll(
                    '.spring-palace-ui-frame,' +
                    '.spring-crown-ui-frame'
                )
                .forEach(
                    element =>
                        element.remove()
                );

            // ULTIMATE / BURST CŨ
            document
                .querySelectorAll(
                    '.spring-crown-screen-burst,' +
                    '.spring-goddess-divine-world'
                )
                .forEach(el => el.remove());

            // XÓA CLASS GIAO DIỆN
            document.documentElement.classList.remove(
                'premium-spring-sanctuary-equipped'
            );

            // PET REALM
            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            if (container) {
                container.classList.remove(
                    'spring-crown-pet-stage-v3',
                    'spring-crown-pet-casting',
                    'pet-premium-spring-stage'
                );

                container
                    .querySelectorAll(
                        '.spring-crown-pet-court,' +
                        '.premium-spring-pet-legacy-realm'
                    )
                    .forEach(el => el.remove());

                const img =
                    container.querySelector(
                        '#virtual-pet-img'
                    );

                img?.classList.remove(
                    'spring-crown-goddess-avatar-v3'
                );
            }
        },


        createPetRealm() {

            const container =
                document.getElementById(
                    'virtual-pet-container'
                );

            const pet =
                container?.querySelector(
                    '#virtual-pet-img'
                );

            if (!container || !pet) {
                return;
            }

            container.classList.add(
                'spring-crown-pet-stage-v3',
                'pet-premium-spring-stage'
            );

            pet.classList.add(
                'spring-crown-goddess-avatar-v3',
                'premium-spring-goddess-magic'
            );

            pet.setAttribute(
                'draggable',
                'false'
            );

            // ========================================================
            // PET REALM V2 · THÁNH VỰC MÙA XUÂN
            // ========================================================

            container
                .querySelector(
                    '.premium-spring-pet-legacy-realm'
                )
                ?.remove();

            const legacyRealm =
                document.createElement('div');

            legacyRealm.className =
                'premium-spring-pet-legacy-realm';

            legacyRealm.setAttribute(
                'aria-hidden',
                'true'
            );

            legacyRealm.innerHTML = `
    <span class="premium-spring-pet-halo"></span>

    <span class="
        premium-spring-pet-ring
        ring-one
    "></span>

    <span class="
        premium-spring-pet-ring
        ring-two
    "></span>

    <span class="
        premium-spring-pet-garden
    "></span>

    <div class="
        premium-spring-pet-mote-field
    "></div>
`;

            const legacyMoteField =
                legacyRealm.querySelector(
                    '.premium-spring-pet-mote-field'
                );

            const legacyMoteCount =
                getLuxuryQualityCount(window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches
                    ? 7
                    : 12);

            for (
                let i = 0;
                i < legacyMoteCount;
                i++
            ) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'premium-spring-pet-mote';

                mote.style.left =
                    `${8 + Math.random() * 76}%`;

                mote.style.top =
                    `${34 + Math.random() * 54}%`;

                mote.style.animationDelay =
                    `${-Math.random() * 7}s`;

                mote.style.transform =
                    `scale(${0.65 +
                    Math.random() * 0.8
                    })`;

                legacyMoteField.appendChild(
                    mote
                );
            }

            container.insertBefore(
                legacyRealm,
                pet
            );


            // Không tạo trùng
            container
                .querySelector(
                    '.spring-crown-pet-court'
                )
                ?.remove();


            const court =
                document.createElement('div');

            court.className =
                'spring-crown-pet-court';

            court.setAttribute(
                'aria-hidden',
                'true'
            );


            court.innerHTML = `
            <div class="spring-crown-pet-throne">

                <span class="spring-crown-throne-petal petal-1"></span>
                <span class="spring-crown-throne-petal petal-2"></span>
                <span class="spring-crown-throne-petal petal-3"></span>
                <span class="spring-crown-throne-petal petal-4"></span>
                <span class="spring-crown-throne-petal petal-5"></span>
                <span class="spring-crown-throne-petal petal-6"></span>
                <span class="spring-crown-throne-petal petal-7"></span>
                <span class="spring-crown-throne-petal petal-8"></span>

                <span class="spring-crown-throne-core">
                    ✦
                </span>

            </div>


            <span class="spring-crown-pet-silk"></span>
            <span class="spring-crown-pet-silk silk-b"></span>
            <span class="spring-crown-pet-silk silk-c"></span>


            <span class="spring-crown-pet-rune rune-a">
                ✦
            </span>

            <span class="spring-crown-pet-rune rune-b">
                ❀
            </span>

            <span class="spring-crown-pet-rune rune-c">
                ◇
            </span>


            <div class="spring-crown-pet-dais">

                <span class="spring-crown-dais-light"></span>

                <span class="spring-crown-dais-bloom bloom-1"></span>
                <span class="spring-crown-dais-bloom bloom-2"></span>
                <span class="spring-crown-dais-bloom bloom-3"></span>
                <span class="spring-crown-dais-bloom bloom-4"></span>
                <span class="spring-crown-dais-bloom bloom-5"></span>

                <span class="spring-crown-dais-leaf leaf-1"></span>
                <span class="spring-crown-dais-leaf leaf-2"></span>
                <span class="spring-crown-dais-leaf leaf-3"></span>

            </div>


            <div class="spring-crown-pet-mote-field"></div>

            <div class="spring-crown-pet-butterfly-field">

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

                <span class="spring-crown-pet-butterfly-v3">
                    <i></i><b></b>
                </span>

            </div>
        `;


            const moteField =
                court.querySelector(
                    '.spring-crown-pet-mote-field'
                );


            for (let i = 0; i < 18; i++) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'spring-crown-pet-mote-v3';

                mote.style.setProperty(
                    '--scp-x',
                    `${6 + Math.random() * 88}%`
                );

                mote.style.setProperty(
                    '--scp-y',
                    `${8 + Math.random() * 80}%`
                );

                mote.style.setProperty(
                    '--scp-size',
                    `${2 + Math.random() * 4}px`
                );

                mote.style.setProperty(
                    '--scp-delay',
                    `${-Math.random() * 5}s`
                );

                moteField.appendChild(
                    mote
                );
            }


            /*
             * Court phải đứng sau ảnh.
             * CSS đã tự quản lý z-index.
             */
            container.insertBefore(
                court,
                pet
            );

            // Gắn kỹ năng riêng cho Xuân Thần
            this.installPetSkill(
                pet,
                container
            );
        },

        // ========================================================
        // CLICK SKILL · XUÂN THẦN
        // ========================================================

        installPetSkill(pet, container) {

            if (!pet || !container) {
                return;
            }

            this.activePetElement = pet;

            this.petClickHandler = event => {

                if (this.skillLocked) {
                    return;
                }

                if (
                    !document.documentElement.classList.contains(
                        'premium-spring-sanctuary-equipped'
                    )
                ) {
                    return;
                }

                const rect =
                    pet.getBoundingClientRect();

                const x =
                    Number.isFinite(event.clientX) &&
                        event.clientX > 0
                        ? event.clientX
                        : rect.left + rect.width / 2;

                const y =
                    Number.isFinite(event.clientY) &&
                        event.clientY > 0
                        ? event.clientY
                        : rect.top + rect.height / 2;

                this.skillLocked = true;

                // 1. Burst ngay quanh pet
                this.createLocalPetBurst(
                    container
                );

                // 2. Burst lan toàn màn hình
                this.createScreenBurst(
                    x,
                    y
                );

                // 3. Ultimate Vạn Sinh Hoa Mộng
                this.createUltimate(
                    x,
                    y,
                    container
                );

                window.setTimeout(() => {
                    this.skillLocked = false;
                }, 6400);
            };

            pet.addEventListener(
                'click',
                this.petClickHandler
            );
        },


        // ========================================================
        // BURST CỤC BỘ QUANH PET
        // ========================================================

        createLocalPetBurst(container) {

            container.classList.add(
                'spring-crown-pet-casting'
            );

            container
                .querySelector(
                    '.spring-crown-pet-burst-v3'
                )
                ?.remove();

            const burst =
                document.createElement('div');

            burst.className =
                'spring-crown-pet-burst-v3';

            for (let i = 0; i < 14; i++) {

                const petal =
                    document.createElement(
                        'span'
                    );

                petal.style.setProperty(
                    '--scp-burst-angle',
                    `${i * (360 / 14)}deg`
                );

                petal.style.setProperty(
                    '--scp-burst-distance',
                    `${48 + Math.random() * 72}px`
                );

                burst.appendChild(
                    petal
                );
            }

            container.appendChild(
                burst
            );

            window.setTimeout(() => {

                burst.remove();

                container.classList.remove(
                    'spring-crown-pet-casting'
                );

            }, 1100);
        },


        // ========================================================
        // BURST TOÀN MÀN HÌNH KHI CHẠM XUÂN THẦN
        // ========================================================

        createScreenBurst(x, y) {

            document
                .querySelectorAll(
                    '.spring-crown-screen-burst'
                )
                .forEach(el => el.remove());

            const burst =
                document.createElement(
                    'div'
                );

            burst.className =
                'spring-crown-screen-burst ' +
                'spring-crown-skill-manifestation';

            burst.style.setProperty(
                '--sc-burst-x',
                `${x}px`
            );

            burst.style.setProperty(
                '--sc-burst-y',
                `${y}px`
            );

            burst.innerHTML = `
        <span class="
            spring-crown-burst-wave
            wave-a
        "></span>

        <span class="
            spring-crown-burst-wave
            wave-b
        "></span>

        <span class="
            spring-crown-burst-wave
            wave-c
        "></span>

        <span class="
            spring-crown-burst-core
        ">
            ✦
        </span>


        <div class="
            spring-crown-burst-ray
        "></div>


        <span class="
            spring-crown-burst-halo
            halo-a
        "></span>

        <span class="
            spring-crown-burst-halo
            halo-b
        "></span>


        <div class="
            spring-crown-burst-petals
        "></div>


        <div class="
            spring-crown-burst-lotus
        ">
            <span class="
                lotus-petal lotus-a
            "></span>

            <span class="
                lotus-petal lotus-b
            "></span>

            <span class="
                lotus-petal lotus-c
            "></span>

            <span class="
                lotus-petal lotus-d
            "></span>

            <span class="
                lotus-petal lotus-e
            "></span>

            <span class="
                lotus-petal lotus-f
            "></span>
        </div>


        <div class="
            spring-crown-burst-sigil
        "></div>


        <div class="
            spring-crown-burst-motes
        "></div>


        <div class="
            spring-crown-burst-butterflies
        "></div>


        <div class="
            spring-crown-burst-title
        ">
            VẠN SINH HOA MỘNG
        </div>
    `;


            // Cánh hoa nổ
            const petals =
                burst.querySelector(
                    '.spring-crown-burst-petals'
                );

            for (let i = 0; i < 18; i++) {

                const petal =
                    document.createElement('i');

                petal.style.setProperty(
                    '--sc-burst-angle',
                    `${i * 20}deg`
                );

                petal.style.setProperty(
                    '--sc-burst-distance',
                    `${75 + Math.random() * 150}px`
                );

                petal.style.setProperty(
                    '--sc-burst-delay',
                    `${Math.random() * 0.18}s`
                );

                petals.appendChild(
                    petal
                );
            }


            // Hạt sáng
            const motes =
                burst.querySelector(
                    '.spring-crown-burst-motes'
                );

            for (let i = 0; i < 22; i++) {

                const mote =
                    document.createElement(
                        'span'
                    );

                mote.className =
                    'spring-crown-burst-mote';

                mote.style.setProperty(
                    '--sc-mote-angle',
                    `${Math.random() * 360}deg`
                );

                mote.style.setProperty(
                    '--sc-mote-distance',
                    `${70 + Math.random() * 170}px`
                );

                mote.style.setProperty(
                    '--sc-mote-size',
                    `${3 + Math.random() * 5}px`
                );

                mote.style.setProperty(
                    '--sc-mote-delay',
                    `${Math.random() * 0.22}s`
                );

                motes.appendChild(
                    mote
                );
            }


            // Bướm bung ra
            const butterflies =
                burst.querySelector(
                    '.spring-crown-burst-butterflies'
                );

            for (let i = 0; i < 6; i++) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-crown-burst-butterfly';

                butterfly.innerHTML =
                    '<b></b><u></u>';

                butterfly.style.setProperty(
                    '--sc-butterfly-angle',
                    `${i * 60}deg`
                );

                butterfly.style.setProperty(
                    '--sc-butterfly-distance',
                    `${90 + Math.random() * 110}px`
                );

                butterfly.style.setProperty(
                    '--sc-butterfly-delay',
                    `${i * 0.06}s`
                );

                butterflies.appendChild(
                    butterfly
                );
            }


            document.body.appendChild(
                burst
            );

            requestAnimationFrame(() => {
                burst.classList.add(
                    'is-active'
                );
            });

            window.setTimeout(
                () => burst.remove(),
                1700
            );
        },


        // ========================================================
        // ULTIMATE · THẦN VỰC — VẠN HOA KHAI GIỚI
        // ========================================================

        createUltimate(x, y, container) {

            document
                .querySelectorAll(
                    '.spring-goddess-divine-world'
                )
                .forEach(el => el.remove());


            const world =
                document.createElement(
                    'div'
                );

            world.className =
                'spring-goddess-divine-world';


            world.innerHTML = `

        <div class="
            spring-goddess-skill-dawn
        "></div>


        <div class="
            spring-goddess-skill-heaven-rays
        "></div>


        <div class="
            spring-goddess-skill-aurora
            aurora-left
        "></div>

        <div class="
            spring-goddess-skill-aurora
            aurora-right
        "></div>


        <!-- MẶT TRỜI HOA THẦN -->
        <div class="
            spring-goddess-skill-sun
        ">

            <span class="
                spring-goddess-skill-sun-core
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-a
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-b
            "></span>

            <span class="
                spring-goddess-skill-sun-ring
                ring-c
            "></span>

        </div>


        <!-- ĐẠI PHÁP TRẬN -->
        <div class="
            spring-goddess-skill-sigil
        ">

            <span class="
                spring-goddess-skill-sigil-ring
                ring-one
            "></span>

            <span class="
                spring-goddess-skill-sigil-ring
                ring-two
            "></span>

            <span class="
                spring-goddess-skill-sigil-ring
                ring-three
            "></span>

            <span class="
                spring-goddess-skill-sigil-core
            ">
                ❀
            </span>

        </div>


        <!-- CỔNG HOA -->
        <div class="
            spring-goddess-skill-gate
        ">

            <span class="
                spring-goddess-skill-pillar
                pillar-left
            "></span>

            <span class="
                spring-goddess-skill-pillar
                pillar-right
            "></span>

            <span class="
                spring-goddess-skill-arch
            "></span>

            <span class="
                spring-goddess-skill-gate-light
            "></span>

        </div>


        <div class="
            spring-goddess-skill-vines
            vines-left
        "></div>

        <div class="
            spring-goddess-skill-vines
            vines-right
        "></div>


        <div class="
            spring-goddess-skill-petal-storm
        "></div>

        <div class="
            spring-goddess-skill-light-seeds
        "></div>

        <div class="
            spring-goddess-skill-butterflies
        "></div>


        <div class="
            spring-goddess-skill-ground-bloom
        "></div>


        <div class="
            spring-goddess-skill-title
        ">
            <small>
                XUÂN THẦN · PREMIUM
            </small>

            <strong>
                VẠN SINH HOA MỘNG
            </strong>
        </div>
    `;


            // ====================================================
            // BÃO CÁNH HOA
            // ====================================================

            const petalStorm =
                world.querySelector(
                    '.spring-goddess-skill-petal-storm'
                );

            const isMobile =
                window.matchMedia(
                    '(max-width:768px),' +
                    '(pointer:coarse)'
                ).matches;

            const petalCount =
                getLuxuryQualityCount(isMobile ? 32 : 62);

            for (
                let i = 0;
                i < petalCount;
                i++
            ) {

                const petal =
                    document.createElement(
                        'span'
                    );

                petal.className =
                    'spring-goddess-skill-petal ' +
                    `petal-${i % 3}`;

                petal.style.left =
                    `${Math.random() * 100}%`;

                petal.style.setProperty(
                    '--spring-petal-size',
                    `${7 + Math.random() * 13}px`
                );

                petal.style.setProperty(
                    '--spring-petal-duration',
                    `${3.8 + Math.random() * 2.2}s`
                );

                petal.style.setProperty(
                    '--spring-petal-delay',
                    `${Math.random() * 1.6}s`
                );

                petal.style.setProperty(
                    '--spring-petal-drift',
                    `${-90 + Math.random() * 180}px`
                );

                petalStorm.appendChild(
                    petal
                );
            }


            // ====================================================
            // HẠT ÁNH SÁNG
            // ====================================================

            const seedField =
                world.querySelector(
                    '.spring-goddess-skill-light-seeds'
                );

            const seedCount =
                getLuxuryQualityCount(isMobile ? 14 : 30);

            for (
                let i = 0;
                i < seedCount;
                i++
            ) {

                const seed =
                    document.createElement(
                        'span'
                    );

                seed.className =
                    'spring-goddess-skill-seed';

                seed.style.left =
                    `${Math.random() * 100}%`;

                seed.style.bottom =
                    `${Math.random() * 45}%`;

                seed.style.setProperty(
                    '--spring-seed-size',
                    `${2 + Math.random() * 5}px`
                );

                seed.style.setProperty(
                    '--spring-seed-delay',
                    `${-Math.random() * 2.5}s`
                );

                seedField.appendChild(
                    seed
                );
            }


            // ====================================================
            // BƯỚM THẦN
            // ====================================================

            const butterflyField =
                world.querySelector(
                    '.spring-goddess-skill-butterflies'
                );

            const butterflyCount =
                getLuxuryQualityCount(isMobile ? 4 : 8);

            for (
                let i = 0;
                i < butterflyCount;
                i++
            ) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-goddess-skill-butterfly';

                butterfly.innerHTML =
                    '<i></i><b></b>';

                butterfly.style.setProperty(
                    '--spring-bfly-start-x',
                    `${5 + Math.random() * 90}%`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-start-y',
                    `${40 + Math.random() * 48}%`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-drift-x',
                    `${-140 + Math.random() * 280}px`
                );

                butterfly.style.setProperty(
                    '--spring-bfly-delay',
                    `${0.3 + i * 0.22}s`
                );

                butterflyField.appendChild(
                    butterfly
                );
            }


            document.body.appendChild(
                world
            );

            requestAnimationFrame(() => {
                world.classList.add(
                    'is-active'
                );
            });


            // ====================================================
            // IMPACT NGAY VỊ TRÍ CLICK
            // ====================================================

            const impact =
                document.createElement(
                    'span'
                );

            impact.className =
                'spring-goddess-skill-impact';

            impact.style.left =
                `${x}px`;

            impact.style.top =
                `${y}px`;

            document.body.appendChild(
                impact
            );

            window.setTimeout(
                () => impact.remove(),
                1400
            );


            // ====================================================
            // HỘP THOẠI CỦA XUÂN THẦN
            // ====================================================

            const dialogue =
                document.createElement(
                    'div'
                );

            dialogue.className =
                'spring-goddess-dialogue-box';

            dialogue.textContent =
                'Vạn vật sinh trưởng — ' +
                'xuân giới khai hoa.';

            container.appendChild(
                dialogue
            );


            window.setTimeout(() => {

                world.remove();
                dialogue.remove();

            }, 6400);
        },


        createWorld() {

            document
                .querySelectorAll(
                    '.premium-spring-world.spring-crown-world-v3'
                )
                .forEach(el => el.remove());


            const world =
                document.createElement(
                    'div'
                );

            world.className =
                'premium-spring-world spring-crown-world-v3';

            world.setAttribute(
                'aria-hidden',
                'true'
            );


            world.innerHTML = `

    <!-- =====================================================
         WEB EFFECT V2 · MƯA HOA & NẮNG MA THUẬT
         ===================================================== -->

    <div class="premium-spring-world-wash"></div>

    <div class="premium-spring-world-sun"></div>

    <div class="premium-spring-legacy-petal-field"></div>

    <div class="
    premium-spring-world-bough
    bough-left
"></div>

<div class="
    premium-spring-world-bough
    bough-right
"></div>


    <!-- =====================================================
         WEB EFFECT V3 · NGỰ HOA THIÊN MÔN
         ===================================================== -->

    <div class="spring-crown-sky-vault">

        <div class="spring-crown-dawn-orb"></div>

                <span class="spring-crown-aurora aurora-a"></span>
                <span class="spring-crown-aurora aurora-b"></span>
                <span class="spring-crown-aurora aurora-c"></span>

                <span class="spring-crown-prism prism-a"></span>
                <span class="spring-crown-prism prism-b"></span>

                <span class="spring-crown-silk-road"></span>
                <span class="spring-crown-silk-road silk-two"></span>
                <span class="spring-crown-silk-road silk-three"></span>

                <div class="spring-crown-petal-field"></div>

                <div class="spring-crown-lumina-field"></div>

                <div class="spring-crown-butterfly-field"></div>

                <div class="spring-crown-sigil-field"></div>


                <div class="spring-crown-edge-garden garden-left">

                    <span class="spring-crown-stem"></span>
                    <span class="spring-crown-stem stem-b"></span>

                    <span class="spring-crown-bloom bloom-a"></span>
                    <span class="spring-crown-bloom bloom-b"></span>
                    <span class="spring-crown-bloom bloom-c"></span>

                    <span class="spring-crown-leaf leaf-a"></span>
                    <span class="spring-crown-leaf leaf-b"></span>

                </div>


                <div class="spring-crown-edge-garden garden-right">

                    <span class="spring-crown-stem"></span>
                    <span class="spring-crown-stem stem-b"></span>

                    <span class="spring-crown-bloom bloom-a"></span>
                    <span class="spring-crown-bloom bloom-b"></span>
                    <span class="spring-crown-bloom bloom-c"></span>

                    <span class="spring-crown-leaf leaf-a"></span>
                    <span class="spring-crown-leaf leaf-b"></span>

                </div>


                <div class="spring-crown-bottom-haze"></div>

            </div>
        `;


            // ========================================================
            // WEB EFFECT V2 · MƯA CÁNH HOA MÙA XUÂN
            // ========================================================

            const legacyPetalField =
                world.querySelector(
                    '.premium-spring-legacy-petal-field'
                );

            const legacyIsMobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;

            const legacyPetalCount =
                getLuxuryQualityCount(legacyIsMobile ? 18 : 36);

            if (legacyPetalField) {

                for (
                    let i = 0;
                    i < legacyPetalCount;
                    i++
                ) {

                    const petal =
                        document.createElement(
                            'span'
                        );

                    petal.className =
                        'premium-spring-screen-petal';

                    petal.style.setProperty(
                        '--ps-x',
                        `${Math.random() * 100}%`
                    );

                    petal.style.setProperty(
                        '--ps-duration',
                        `${7 + Math.random() * 8}s`
                    );

                    petal.style.setProperty(
                        '--ps-delay',
                        `${-Math.random() * 12}s`
                    );

                    petal.style.transform =
                        `scale(${0.55 + Math.random() * 0.85})`;

                    legacyPetalField.appendChild(
                        petal
                    );
                }
            }

            const petalField =
                world.querySelector(
                    '.spring-crown-petal-field'
                );


            const isMobile =
                window.matchMedia(
                    '(max-width: 768px), (pointer: coarse)'
                ).matches;


            const petalCount =
                getLuxuryQualityCount(isMobile ? 22 : 42);


            for (
                let i = 0;
                i < petalCount;
                i++
            ) {

                const petal =
                    document.createElement(
                        'span'
                    );

                const types = [
                    'petal-round',
                    'petal-heart',
                    'petal-lance'
                ];

                petal.className =
                    'spring-crown-falling-petal ' +
                    types[i % types.length] +
                    (i % 4 === 0
                        ? ' is-near'
                        : '');

                petal.style.setProperty(
                    '--sc-x',
                    `${Math.random() * 100}%`
                );

                petal.style.setProperty(
                    '--sc-size',
                    `${7 + Math.random() * 11}px`
                );

                petal.style.setProperty(
                    '--sc-duration',
                    `${7 + Math.random() * 8}s`
                );

                petal.style.setProperty(
                    '--sc-delay',
                    `${-Math.random() * 12}s`
                );

                petalField.appendChild(
                    petal
                );
            }


            const luminaField =
                world.querySelector(
                    '.spring-crown-lumina-field'
                );


            const luminaCount =
                getLuxuryQualityCount(isMobile ? 12 : 26);


            for (
                let i = 0;
                i < luminaCount;
                i++
            ) {

                const light =
                    document.createElement(
                        'span'
                    );

                light.className =
                    'spring-crown-lumina';

                light.style.setProperty(
                    '--sc-lx',
                    `${Math.random() * 100}%`
                );

                light.style.setProperty(
                    '--sc-ly',
                    `${Math.random() * 100}%`
                );

                light.style.setProperty(
                    '--sc-lsize',
                    `${2 + Math.random() * 4}px`
                );

                light.style.setProperty(
                    '--sc-lduration',
                    `${3 + Math.random() * 5}s`
                );

                light.style.setProperty(
                    '--sc-ldelay',
                    `${-Math.random() * 6}s`
                );

                luminaField.appendChild(
                    light
                );
            }


            const butterflyField =
                world.querySelector(
                    '.spring-crown-butterfly-field'
                );


            const butterflyCount =
                getLuxuryQualityCount(isMobile ? 3 : 6);


            for (
                let i = 0;
                i < butterflyCount;
                i++
            ) {

                const butterfly =
                    document.createElement(
                        'span'
                    );

                butterfly.className =
                    'spring-crown-screen-butterfly';

                butterfly.innerHTML =
                    '<i></i><b></b>';

                butterfly.style.setProperty(
                    '--sc-by',
                    `${12 + Math.random() * 70}%`
                );

                butterfly.style.setProperty(
                    '--sc-bscale',
                    `${0.6 + Math.random() * 0.7}`
                );

                butterfly.style.setProperty(
                    '--sc-bduration',
                    `${12 + Math.random() * 10}s`
                );

                butterfly.style.setProperty(
                    '--sc-bdelay',
                    `${-Math.random() * 18}s`
                );

                butterflyField.appendChild(
                    butterfly
                );
            }


            const sigilField =
                world.querySelector(
                    '.spring-crown-sigil-field'
                );


            ['✦', '❀', '◇', '✧', '❖']
                .forEach(
                    (symbol, index) => {

                        const sigil =
                            document.createElement(
                                'span'
                            );

                        sigil.className =
                            'spring-crown-sigil';

                        sigil.textContent =
                            symbol;

                        sigil.style.setProperty(
                            '--sc-sx',
                            `${12 + index * 18}%`
                        );

                        sigil.style.setProperty(
                            '--sc-sy',
                            `${18 + (index * 17) % 62}%`
                        );

                        sigil.style.setProperty(
                            '--sc-ssize',
                            `${16 + index * 3}px`
                        );

                        sigil.style.setProperty(
                            '--sc-sdelay',
                            `${-index * 0.8}s`
                        );

                        sigilField.appendChild(
                            sigil
                        );
                    }
                );


            document.body.appendChild(
                world
            );


            requestAnimationFrame(
                () => {
                    world.classList.add(
                        'is-active'
                    );
                }
            );
        },


        createInterface() {

            document.documentElement
                .classList.add(
                    'premium-spring-sanctuary-equipped'
                );


            // Chỉ dọn khung giao diện cũ.
            // KHÔNG xóa World Effect vừa tạo.

            document
                .querySelectorAll(
                    '.spring-palace-ui-frame,' +
                    '.spring-crown-ui-frame'
                )
                .forEach(
                    element =>
                        element.remove()
                );


            const frame =
                document.createElement(
                    'div'
                );

            frame.className =
                'spring-palace-ui-frame';

            frame.setAttribute(
                'aria-hidden',
                'true'
            );


            frame.innerHTML = `
            <div class="spring-palace-top-arch">

                <span class="spring-palace-arch-line"></span>

                <span class="spring-palace-arch-bloom">
                    ❀
                </span>

                <span class="spring-palace-arch-gem">
                    ✦
                </span>

                <span class="spring-palace-arch-bloom">
                    ❀
                </span>

                <span class="
                    spring-palace-arch-line
                    line-right
                "></span>

            </div>


            <div class="
                spring-palace-side-vine
                vine-left
            ">
                <i></i><i></i><i></i><i></i><i></i>
            </div>


            <div class="
                spring-palace-side-vine
                vine-right
            ">
                <i></i><i></i><i></i><i></i><i></i>
            </div>


            <span class="
                spring-palace-corner-garden
                garden-tl
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-tr
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-bl
            "></span>

            <span class="
                spring-palace-corner-garden
                garden-br
            "></span>


            <div class="spring-palace-bottom-seal">
                <i></i>
                <b>❀ ✦ ❀</b>
                <i></i>
            </div>
        `;


            document.body.appendChild(
                frame
            );


            requestAnimationFrame(
                () => {
                    frame.classList.add(
                        'is-mounted'
                    );
                }
            );
        },


        mount() {

            this.clear();

            this.createPetRealm();
            this.createWorld();
            this.createInterface();
        }
    };

    // ========================================================
    // GẮN RUNTIME LUXURY VÀO PETMANAGER
    // ========================================================

    function installLuxurySpringPetHook(
        attempt = 0
    ) {

        if (
            typeof PetManager === 'undefined' ||
            typeof PetManager.spawnPet !== 'function'
        ) {

            if (attempt < 100) {
                setTimeout(
                    () =>
                        installLuxurySpringPetHook(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }


        if (
            PetManager.__luxurySpringHookInstalled
        ) {
            return;
        }


        const originalSpawnPet =
            PetManager.spawnPet.bind(
                PetManager
            );


        PetManager.spawnPet =
            function (petData) {
                if (window.isStudentStoreGameAccessEnabled?.() === false) return false;
                LuxuryAutumnRuntime.clear();
                LuxuryHacMongRuntime.clear();

                /*
                 * Mỗi lần đổi pet dọn toàn bộ runtime Luxury đang hoạt động.
                 * Tuyệt đối KHÔNG gọi EffectManager.clearEffects(),
                 * nên vật phẩm Effect đang trang bị vẫn độc lập.
                 */
                try {
                    LuxurySpringRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Xuân Thần:',
                        error
                    );
                }

                try {
                    LuxurySummerRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Hạ Thần:',
                        error
                    );
                }

                try {
                    LuxuryNationalDayRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Quốc khánh:',
                        error
                    );
                }

                try {
                    LuxuryNyxRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Nyx:',
                        error
                    );
                }


                try {
                    LuxuryAetherRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Aether:',
                        error
                    );
                }

                try {
                    LuxuryLotmKleinRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime LOTM Klein:',
                        error
                    );
                }

                try {
                    LuxuryCamCoCamMongRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Cầm Mộng:',
                        error
                    );
                }

                try {
                    LuxuryTamonBSideRuntime.clear();
                } catch (error) {
                    console.warn(
                        "[LuxuryStore] Không thể dọn runtime Tamon's B-Side:",
                        error
                    );
                }

                try {
                    LuxuryTamonPinkStaticRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Tamon Pink Static:',
                        error
                    );
                }

                try {
                    LuxuryMidAutumnRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Trung thu:',
                        error
                    );
                }

                try {
                    LuxuryLinkClickChengRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Link Click:',
                        error
                    );
                }

                try {
                    LuxuryStarryNightRuntime.clear();
                } catch (error) {
                    console.warn(
                        '[LuxuryStore] Không thể dọn runtime Đêm đầy sao:',
                        error
                    );
                }

// Render pet gốc trước.
                originalSpawnPet(
                    petData
                );


                if (petData?.id === HAC_MONG_PREMIUM_PET.id) {
                    LuxuryHacMongRuntime.mount();
                    return;
                }
                if (petData?.id === AUTUMN_PREMIUM_PET.id) {
                    LuxuryAutumnRuntime.mount();
                    return;
                }

                const isLuxurySpring =
                    petData?.id ===
                    'pet_luxury_mua_xuan' ||
                    petData?.petEffect ===
                    'premium-spring-goddess-magic';

                const isLuxurySummer =
                    petData?.id ===
                    'pet_luxury_mua_ha' ||
                    petData?.petEffect ===
                    'premium-summer-solstice-magic';

                const isNationalDay =
                    petData?.id ===
                    'pet_quoc_khanh_1' ||
                    petData?.petEffect ===
                    'national-day-dong-son-magic';

                const isMythicNyx =
                    petData?.id ===
                    'pet_mythic_nyx_1' ||
                    petData?.petEffect ===
                    'mythic-nyx-night-magic';


                const isMythicAether =
                    petData?.id ===
                    'pet_mythic_aether_1' ||
                    petData?.petEffect ===
                    'mythic-aether-luminous-magic';

                const isLotmKlein =
                    petData?.id ===
                    'pet_lotm_klein_event_1' ||
                    petData?.petEffect ===
                    'lotm-klein-mystery-magic';

                const isCamCoCamMong =
                    petData?.id ===
                    'pet_cam_co_cam_mong_1' ||
                    petData?.petEffect ===
                    'cam-co-cam-mong-qin-dream-magic';

                const isTamonBSide =
                    petData?.id ===
                    'pet_tamon_b_side_1' ||
                    petData?.petEffect ===
                    'tamon-b-side-soundwave-magic';

                const isTamonPinkStatic =
                    petData?.id ===
                    'pet_tamon_b_side_2' ||
                    petData?.petEffect ===
                    'tamon-pink-static-magic';

                const isMidAutumnMoonPalace =
                    petData?.id ===
                    'pet_trung_thu_nguyet_cung_tien_tu' ||
                    petData?.id ===
                    'pet_trung_thu_chu_cuoi_2' ||
                    petData?.petEffect ===
                    'midautumn-moon-palace-pet-magic' ||
                    petData?.petEffect ===
                    'midautumn-cuoi-moonwood-magic';

                const isLinkClickCheng =
                    petData?.id ===
                    'pet_linkclick_cheng_xiaoshi_1' ||
                    petData?.petEffect ===
                    'linkclick-cheng-timeframe-magic';

                const isStarryNight =
                    petData?.id ===
                    'pet_dem_day_sao_1' ||
                    petData?.petEffect ===
                    'starry-night-van-gogh-magic';
/*
                 * XUÂN THẦN:
                 * phải mount lại đủ Pet Realm + World + Interface.
                 * Đây là nhánh đã bị mất trong bản trước.
                 */
                if (isLuxurySpring) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxurySpringRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Xuân Thần:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * HẠ THẦN · NHẬT DIỆU LƯU KIM:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + pet skill + drag trail.
                 * Không ghi đè active_theme / active_effect.
                 */
                if (isLuxurySummer) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxurySummerRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Hạ Thần:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * LORD OF THE MYSTERIES · KLEIN:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không chiếm active_theme/effect.
                 */
                if (isLotmKlein) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryLotmKleinRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount LOTM Klein:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * CẦM CƠ · CẦM MỘNG:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không đụng effect/theme storage.
                 */
                if (isCamCoCamMong) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryCamCoCamMongRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Cầm Mộng:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * TAMON'S B-SIDE:
                 * Runtime riêng dựng pet realm + world + interface + click.
                 * Không gọi ThemeManager/EffectManager nên không xóa lớp khác.
                 */
                if (isTamonBSide) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryTamonBSideRuntime.mount();
                            } catch (error) {
                                console.error(
                                    "[LuxuryStore] Lỗi mount Tamon's B-Side:",
                                    error
                                );
                            }
                        }
                    );

                    return;
                }

                /*
                 * TAMON PINK STATIC:
                 * Suite #2 hoàn toàn mới: cassette + sticker + black/pink UI.
                 */
                if (isTamonPinkStatic) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryTamonPinkStaticRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Tamon Pink Static:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * TRUNG THU · NGUYỆT CUNG TIÊN TỬ:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + fullscreen ultimate khi click pet.
                 * Không ghi đè active_theme / active_effect.
                 */
                if (isMidAutumnMoonPalace) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryMidAutumnRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Nguyệt Cung Tiên Tử:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }

                /*
                 * LINK CLICK · CHENG XIAOSHI:
                 * Full suite riêng: world + interface + pet realm
                 * + click toàn web + ultimate khi nhấn nhân vật.
                 */
                if (isLinkClickCheng) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryLinkClickChengRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Cheng Xiaoshi:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * ĐÊM ĐẦY SAO:
                 * Full suite riêng: world + interface + pet realm
                 * + global click + ultimate. Không chiếm active_theme/effect.
                 */
                if (isStarryNight) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryStarryNightRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Đêm đầy sao:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * AETHER THẦN THOẠI:
                 * Runtime riêng dựng world + interface + pet realm
                 * + click toàn web + ultimate khi nhấn nhân vật.
                 */
                if (isMythicAether) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryAetherRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Aether:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * NYX THẦN THOẠI:
                 * PetManager dựng pet realm + ultimate gốc.
                 * Runtime V2 bổ sung World + Interface + global click
                 * + screen burst khi nhấn Nyx.
                 */
                if (isMythicNyx) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryNyxRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Nyx:',
                                    error
                                );
                            }
                        }
                    );

                    return;
                }


                /*
                 * QUỐC KHÁNH:
                 * PetManager tự dựng pet realm + click skill.
                 * Runtime này chỉ bổ sung World + Interface.
                 */
                if (isNationalDay) {
                    requestAnimationFrame(
                        () => {
                            try {
                                LuxuryNationalDayRuntime.mount();
                            } catch (error) {
                                console.error(
                                    '[LuxuryStore] Lỗi mount Quốc khánh:',
                                    error
                                );
                            }
                        }
                    );
                }
            };


        PetManager.__luxurySpringHookInstalled =
            true;
    }

    // ========================================================
    // GỠ XUÂN THẦN → DỌN TOÀN BỘ RUNTIME LUXURY
    // ========================================================

    function installLuxurySpringUnapplyHook(
        attempt = 0
    ) {

        if (
            typeof StoreManager === 'undefined' ||
            typeof StoreManager.unapplyItem !== 'function'
        ) {

            if (attempt < 100) {
                setTimeout(
                    () =>
                        installLuxurySpringUnapplyHook(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }


        if (
            StoreManager.__luxurySpringUnapplyHookInstalled
        ) {
            return;
        }


        const originalUnapplyItem =
            StoreManager.unapplyItem.bind(
                StoreManager
            );


        StoreManager.unapplyItem =
            async function (itemId) {
                if (String(itemId) === HAC_MONG_PREMIUM_PET.id) LuxuryHacMongRuntime.clear();
                if (String(itemId) === AUTUMN_PREMIUM_PET.id) LuxuryAutumnRuntime.clear();

                const isLuxurySpring =
                    String(itemId) ===
                    'pet_luxury_mua_xuan';

                const isLuxurySummer =
                    String(itemId) ===
                    'pet_luxury_mua_ha';

                const isNationalDay =
                    String(itemId) ===
                    'pet_quoc_khanh_1';

                const isMythicNyx =
                    String(itemId) ===
                    'pet_mythic_nyx_1';


                const isMythicAether =
                    String(itemId) ===
                    'pet_mythic_aether_1';

                const isLotmKlein =
                    String(itemId) ===
                    'pet_lotm_klein_event_1';

                const isCamCoCamMong =
                    String(itemId) ===
                    'pet_cam_co_cam_mong_1';

                const isTamonBSide =
                    String(itemId) ===
                    'pet_tamon_b_side_1';

                const isTamonPinkStatic =
                    String(itemId) ===
                    'pet_tamon_b_side_2';

                const isMidAutumnMoonPalace =
                    String(itemId) ===
                    'pet_trung_thu_nguyet_cung_tien_tu' ||
                    String(itemId) ===
                    'pet_trung_thu_chu_cuoi_2';

                const isLinkClickCheng =
                    String(itemId) ===
                    'pet_linkclick_cheng_xiaoshi_1';

                const isStarryNight =
                    String(itemId) ===
                    'pet_dem_day_sao_1';
/*
                 * DỌN NGAY trước khi Firebase cập nhật.
                 */
                if (isLuxurySpring) {
                    LuxurySpringRuntime.clear();
                }

                if (isLuxurySummer) {
                    LuxurySummerRuntime.clear();
                }

                if (isMythicNyx) {
                    LuxuryNyxRuntime.clear();
                }


                if (isMythicAether) {
                    LuxuryAetherRuntime.clear();
                }

                if (isLotmKlein) {
                    LuxuryLotmKleinRuntime.clear();
                }

                if (isCamCoCamMong) {
                    LuxuryCamCoCamMongRuntime.clear();
                }

                if (isTamonBSide) {
                    LuxuryTamonBSideRuntime.clear();
                }

                if (isTamonPinkStatic) {
                    LuxuryTamonPinkStaticRuntime.clear();
                }

                if (isMidAutumnMoonPalace) {
                    LuxuryMidAutumnRuntime.clear();
                }

                if (isLinkClickCheng) {
                    LuxuryLinkClickChengRuntime.clear();
                }

                if (isStarryNight) {
                    LuxuryStarryNightRuntime.clear();
                }

if (isNationalDay) {

                    LuxuryNationalDayRuntime.clear();

                    if (
                        typeof PetManager !== 'undefined' &&
                        typeof PetManager.clearNationalDayRealm ===
                        'function'
                    ) {
                        PetManager.clearNationalDayRealm();
                    }
                }


                try {

                    return await originalUnapplyItem(
                        itemId
                    );

                } finally {

                    /*
                     * DỌN LẦN 2 sau khi hàm gỡ gốc hoàn tất.
                     * Chặn trường hợp observer/render tạo lại
                     * một phần hiệu ứng trong lúc Firebase cập nhật.
                     */
                    if (isLuxurySpring) {

                        LuxurySpringRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        if (container) {

                            container.classList.remove(
                                'spring-crown-pet-stage-v3',
                                'spring-crown-pet-casting',
                                'pet-premium-spring-stage'
                            );

                            container
                                .querySelectorAll(
                                    '.spring-crown-pet-court,' +
                                    '.spring-crown-pet-burst-v3,' +
                                    '.premium-spring-pet-legacy-realm'
                                )
                                .forEach(
                                    element =>
                                        element.remove()
                                );
                        }


                        document.documentElement
                            .classList.remove(
                                'premium-spring-sanctuary-equipped'
                            );


                        document
                            .querySelectorAll(
                                '.premium-spring-world.spring-crown-world-v3,' +
                                '.spring-crown-ui-frame,' +
                                '.spring-palace-ui-frame,' +
                                '.spring-crown-screen-burst,' +
                                '.spring-goddess-divine-world,' +
                                '.spring-goddess-skill-impact,' +
                                '.spring-goddess-dialogue-box'
                            )
                            .forEach(
                                element =>
                                    element.remove()
                            );
                    }


                    if (isLuxurySummer) {
                        LuxurySummerRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-summer-solstice-stage',
                            'summer-solstice-awakening',
                            'summer-solstice-casting'
                        );

                        document.documentElement.classList.remove(
                            'summer-solstice-equipped',
                            'summer-solstice-skill-active'
                        );

                        document
                            .querySelectorAll(
                                '.summer-solstice-world,' +
                                '.summer-solstice-ui-frame,' +
                                '.summer-solstice-pet-realm,' +
                                '.summer-solstice-click-burst,' +
                                '.summer-solstice-drag-trail,' +
                                '.summer-solstice-ultimate,' +
                                '.summer-solstice-pet-dialogue,' +
                                '.summer-solstice-local-burst'
                            )
                            .forEach(node => node.remove());
                    }

                    if (isMythicNyx) {
                        LuxuryNyxRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-nyx-mythic-stage',
                            'nyx-mythic-awakening',
                            'nyx-mythic-casting'
                        );

                        document.documentElement.classList.remove(
                            'nyx-mythic-pet-equipped',
                            'nyx-first-night-equipped'
                        );

                        document
                            .querySelectorAll(
                                '.nyx-mythic-ultimate,' +
                                '.nyx-mythic-pet-realm,' +
                                '.nyx-mythic-world-v2,' +
                                '.nyx-mythic-ui-frame-v2,' +
                                '.nyx-mythic-screen-burst-v2,' +
                                '.nyx-mythic-screen-dialogue-v2'
                            )
                            .forEach(element => element.remove());
                    }

                    if (isMythicAether) {
                        LuxuryAetherRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-aether-mythic-stage',
                            'aether-mythic-awakening',
                            'aether-mythic-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.aether-mythic-pet-realm'
                            )
                            .forEach(element => element.remove());

                        document.documentElement.classList.remove(
                            'aether-luminous-equipped',
                            'aether-luminous-skill-active'
                        );

                        document.body?.classList.remove(
                            'theme-aether-luminous-stage'
                        );
                    }

                    if (isLotmKlein) {
                        LuxuryLotmKleinRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-lotm-klein-stage',
                            'lotm-klein-casting'
                        );

                        container
                            ?.querySelectorAll('.lotm-klein-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove('lotm-klein-pet');

                        document.documentElement.classList.remove(
                            'lotm-klein-equipped',
                            'lotm-klein-skill-active'
                        );

                        document.body?.classList.remove(
                            'theme-lotm-klein-premium'
                        );
                    }

                    if (isCamCoCamMong) {
                        LuxuryCamCoCamMongRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-cam-co-cam-mong-stage',
                            'cam-co-cam-mong-casting'
                        );

                        container
                            ?.querySelectorAll('.cam-co-cam-mong-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove('cam-co-cam-mong-pet');

                        document.documentElement.classList.remove(
                            'cam-co-cam-mong-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-cam-co-cam-mong'
                        );
                    }

                    if (isTamonBSide) {
                        LuxuryTamonBSideRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-tamon-bside-stage',
                            'tamon-bside-pet-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.tamon-bside-pet-realm'
                            )
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'tamon-bside-pet'
                            );

                        document.documentElement.classList.remove(
                            'tamon-bside-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-tamon-bside-stage'
                        );
                    }

                    if (isTamonPinkStatic) {
                        LuxuryTamonPinkStaticRuntime.clear();

                        const container =
                            document.getElementById(
                                'virtual-pet-container'
                            );

                        container?.classList.remove(
                            'pet-tamon-pinkstatic-stage',
                            'tamon-pinkstatic-casting'
                        );

                        container
                            ?.querySelectorAll(
                                '.tamon-pinkstatic-realm'
                            )
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'tamon-pinkstatic-pet'
                            );

                        document.documentElement.classList.remove(
                            'tamon-pinkstatic-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-tamon-pinkstatic-stage'
                        );
                    }

                    if (isMidAutumnMoonPalace) {
                        LuxuryMidAutumnRuntime.clear();

                        const container =
                            document.getElementById('virtual-pet-container');

                        container?.classList.remove(
                            'pet-midautumn-moon-palace-stage',
                            'pet-midautumn-cuoi-stage',
                            'midautumn-pet-casting'
                        );

                        container
                            ?.querySelectorAll('.midautumn-pet-realm')
                            .forEach(element => element.remove());

                        container
                            ?.querySelector('#virtual-pet-img')
                            ?.classList.remove(
                                'midautumn-moon-palace-pet',
                                'midautumn-cuoi-pet'
                            );

                        document.documentElement.classList.remove(
                            'midautumn-moon-palace-equipped',
                            'midautumn-moon-palace-skill-active',
                            'midautumn-cuoi-equipped'
                        );

                        document.body?.classList.remove(
                            'theme-midautumn-moon-palace',
                            'theme-midautumn-cuoi'
                        );
                    }

                    if (isLinkClickCheng) {
                        LuxuryLinkClickChengRuntime.clear();
                    }

                    if (isStarryNight) {
                        LuxuryStarryNightRuntime.clear();
                    }

                    if (isNationalDay) {

                        LuxuryNationalDayRuntime.clear();

                        if (
                            typeof PetManager !== 'undefined' &&
                            typeof PetManager.clearNationalDayRealm ===
                            'function'
                        ) {
                            PetManager.clearNationalDayRealm();
                        }
                    }
                }
            };


        StoreManager.__luxurySpringUnapplyHookInstalled =
            true;
    }

    // ========================================================
    // KHÓA TRANG BỊ GIỮA CỬA HÀNG THƯỜNG / SANG TRỌNG
    // Ngoại lệ: Nền (background) và Khung viền (frame)
    // ========================================================

    const STORE_BOUNDARY_EXEMPT_TYPES =
        new Set([
            'background',
            'frame'
        ]);

    function isStoreBoundaryExempt(item) {
        return STORE_BOUNDARY_EXEMPT_TYPES.has(
            String(item?.type || '')
                .trim()
                .toLowerCase()
        );
    }

    function isLuxuryBoundaryItem(itemOrId) {
        const itemId =
            typeof itemOrId === 'object'
                ? itemOrId?.id
                : itemOrId;

        const item =
            typeof itemOrId === 'object'
                ? itemOrId
                : (
                    typeof StoreManager !== 'undefined'
                        ? StoreManager.getItemById(itemId)
                        : null
                );

        return (
            item?.luxuryOnly === true ||
            LUXURY_ITEM_IDS.includes(
                String(itemId || '')
            )
        );
    }

    // ========================================================
    // DỌN TRẠNG THÁI TRÌNH DUYỆT KHI ĐỔI GIỮA 2 CỬA HÀNG
    // - Tự sửa cả trạng thái cũ từng bị kẹt do chỉ đổi Firebase.
    // - Chỉ dọn pet/theme/effect thuộc cửa hàng ĐỐI DIỆN.
    // - Nền và Khung viền vẫn giữ nguyên.
    // ========================================================
    function getBoundaryActiveItem(storageKey) {
        const activeId = localStorage.getItem(storageKey);

        if (!activeId) {
            return null;
        }

        const item = StoreManager.getItemById(activeId);

        if (!item || isStoreBoundaryExempt(item)) {
            return null;
        }

        return item;
    }

    function isOppositeBoundaryItem(
        item,
        targetIsLuxury
    ) {
        return Boolean(item) &&
            isLuxuryBoundaryItem(item) !== targetIsLuxury;
    }

    function getOppositeStoreBrowserItems(
        targetIsLuxury
    ) {
        const storageKeys = [
            'active_pet',
            'active_theme',
            'active_effect'
        ];

        const items = [];
        const seenIds = new Set();

        storageKeys.forEach(storageKey => {
            const item =
                getBoundaryActiveItem(storageKey);

            if (
                !isOppositeBoundaryItem(
                    item,
                    targetIsLuxury
                )
            ) {
                return;
            }

            const itemId = String(item.id);

            if (seenIds.has(itemId)) {
                return;
            }

            seenIds.add(itemId);
            items.push(item);
        });

        return items;
    }

    function hardClearBoundaryPetRuntime() {
        /*
         * Dọn các runtime Luxury trước.
         * Các hàm này đều nằm trong cùng module luxury-store.js.
         */
        [
            LuxuryHacMongRuntime,
            LuxuryAutumnRuntime,
            LuxurySpringRuntime,
            LuxurySummerRuntime,
            LuxuryNationalDayRuntime,
            LuxuryNyxRuntime,
            LuxuryAetherRuntime,
            LuxuryTamonBSideRuntime,
            LuxuryTamonPinkStaticRuntime,
            LuxuryLotmKleinRuntime,
            LuxuryCamCoCamMongRuntime,
            LuxuryMidAutumnRuntime,
            LuxuryLinkClickChengRuntime,
            LuxuryStarryNightRuntime
        ].forEach(runtime => {
            try {
                runtime?.clear?.();
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể dọn Luxury pet runtime:',
                    error
                );
            }
        });

        if (typeof PetManager !== 'undefined') {
            [
                'clearSlothDreamRealm',
                'clearBirthday2026Realm',
                'clearPremiumSpringRealm',
                'clearSummerLimitedHa2Realm',
                'clearNationalDayRealm'
            ].forEach(methodName => {
                try {
                    PetManager[methodName]?.call(PetManager);
                } catch (error) {
                    console.warn(
                        `[LuxuryStore] Không thể gọi PetManager.${methodName}():`,
                        error
                    );
                }
            });
        }

        if (
            typeof PetInteractionManager !== 'undefined' &&
            typeof PetInteractionManager.detachEvents === 'function'
        ) {
            try {
                PetInteractionManager.detachEvents({
                    keepLoop: false,
                    removeHungerBar: true
                });
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể dọn tương tác pet:',
                    error
                );
            }
        }

        const container =
            document.getElementById('virtual-pet-container');

        if (container) {
            container.innerHTML = '';
            container.style.display = 'none';
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
            container.setAttribute('aria-hidden', 'true');
        }

        document
            .querySelectorAll(
                '.nyx-mythic-ultimate,' +
                '.tbc1-fullscreen-ultimate,' +
                '.nd29-independence-flash,' +
                '.nd29-pet-dialogue'
            )
            .forEach(node => node.remove());

        localStorage.removeItem('active_pet');
    }

    function clearOppositeStoreBrowserRuntime(
        targetIsLuxury
    ) {
        /*
         * EFFECT
         * clearEffects(true) xóa cả DOM effect + active_effect,
         * tránh visibilitychange khôi phục lại hiệu ứng cũ.
         */
        const activeEffect =
            getBoundaryActiveItem('active_effect');

        if (
            isOppositeBoundaryItem(
                activeEffect,
                targetIsLuxury
            )
        ) {
            if (
                typeof EffectManager !== 'undefined' &&
                typeof EffectManager.clearEffects === 'function'
            ) {
                EffectManager.clearEffects(true);
            } else {
                localStorage.removeItem('active_effect');
            }
        }

        /*
         * THEME
         * Trả về mặc định rồi xóa active_theme để không tự hồi sinh
         * giao diện cũ ở lần tải trang kế tiếp.
         */
        const activeTheme =
            getBoundaryActiveItem('active_theme');

        if (
            isOppositeBoundaryItem(
                activeTheme,
                targetIsLuxury
            )
        ) {
            if (
                typeof ThemeManager !== 'undefined' &&
                typeof ThemeManager.applyTheme === 'function'
            ) {
                ThemeManager.applyTheme('default');
            }

            localStorage.removeItem('active_theme');
        }

        /* PET */
        const activePet =
            getBoundaryActiveItem('active_pet');

        if (
            isOppositeBoundaryItem(
                activePet,
                targetIsLuxury
            )
        ) {
            hardClearBoundaryPetRuntime();
        }
    }

    async function prepareStoreBoundaryEquip(
        itemId
    ) {
        const targetItem =
            StoreManager.getItemById(itemId);

        if (!targetItem) {
            return true;
        }

        /*
         * Nền và Khung viền:
         * không tham gia cơ chế khóa hai cửa hàng.
         */
        if (
            isStoreBoundaryExempt(
                targetItem
            )
        ) {
            return true;
        }

        let user;
        try { user = JSON.parse(localStorage.getItem('currentUser') || 'null'); }
        catch (_) { return false; }

        if (
            typeof db === 'undefined' ||
            !user?.username
        ) {
            return true;
        }

        const inventoryRef =
            db.ref(
                `student_inventory/${user.username}`
            );

        const snapshot =
            await inventoryRef.once('value');

        const inventory =
            snapshot.val() || {};

        const entries =
            Object.entries(inventory);

        /*
         * Tìm chính vật phẩm người dùng
         * đang muốn trang bị trong kho.
         */
        const targetEntry =
            entries.find(
                ([, inv]) =>
                    String(inv?.id) ===
                    String(itemId)
            ) || null;

        if (!targetEntry) {
            return true;
        }

        const targetIsLuxury =
            isLuxuryBoundaryItem(
                targetItem
            );

        const conflicts = [];

        /*
         * Tìm vật phẩm đang trang bị
         * thuộc cửa hàng ĐỐI DIỆN.
         */
        entries.forEach(
            ([firebaseKey, inv]) => {

                if (
                    inv?.isEquipped !== true
                ) {
                    return;
                }

                if (
                    String(inv.id) ===
                    String(itemId)
                ) {
                    return;
                }

                const equippedItem =
                    StoreManager.getItemById(
                        inv.id
                    );

                if (!equippedItem) {
                    return;
                }

                /*
                 * Nền và Khung viền
                 * luôn được giữ nguyên.
                 */
                if (
                    isStoreBoundaryExempt(
                        equippedItem
                    )
                ) {
                    return;
                }

                const equippedIsLuxury =
                    isLuxuryBoundaryItem(
                        equippedItem
                    );

                if (
                    equippedIsLuxury !==
                    targetIsLuxury
                ) {
                    conflicts.push({
                        firebaseKey,
                        item: equippedItem
                    });
                }
            }
        );

        /*
         * Ngoài Firebase, kiểm tra thêm runtime/localStorage.
         * Đây là lớp tự chữa cho các phiên bản cũ từng chỉ đổi
         * isEquipped=false nhưng không dọn giao diện thật.
         */
        const browserConflictItems =
            getOppositeStoreBrowserItems(
                targetIsLuxury
            );

        /*
         * Không có đồ phía đối diện ở cả Firebase lẫn trình duyệt
         * → mặc bình thường.
         */
        if (
            !conflicts.length &&
            !browserConflictItems.length
        ) {
            return true;
        }

        const oldStore =
            targetIsLuxury
                ? 'Cửa hàng thường'
                : 'Cửa hàng Sang trọng';

        const newStore =
            targetIsLuxury
                ? 'Cửa hàng Sang trọng'
                : 'Cửa hàng thường';

        const equippedNames =
            Array.from(
                new Map(
                    [
                        ...conflicts.map(
                            conflict => conflict.item
                        ),
                        ...browserConflictItems
                    ].map(item => [
                        String(item.id),
                        item
                    ])
                ).values()
            )
                .map(item => `• ${item.name}`)
                .join('\n');

        const agreed =
            confirm(
                `⚠️ Bạn đang trang bị vật phẩm từ ${oldStore}:\n\n` +
                `${equippedNames}\n\n` +

                `Bạn không thể đồng thời trang bị vật phẩm ` +
                `giữa Cửa hàng thường và Cửa hàng Sang trọng.\n\n` +

                `Nếu tiếp tục, hệ thống sẽ gỡ các vật phẩm trên ` +
                `và trang bị [${targetItem.name}] từ ${newStore}.\n\n` +

                `Nền và Khung viền sẽ KHÔNG bị gỡ.\n\n` +

                `Bạn có đồng ý không?`
            );

        if (!agreed) {

            /*
             * Trường hợp vừa MUA món mới:
             * logic mua hiện tại có thể đã đặt
             * isEquipped = true trước khi gọi applyItem().
             *
             * Nếu người dùng bấm Hủy,
             * đưa món mới về chưa trang bị,
             * nhưng KHÔNG xóa khỏi kho.
             */

            return false;
        }

        /*
         * Người dùng đồng ý:
         * GỠ THẬT toàn bộ vật phẩm của cửa hàng đối diện.
         * Không chỉ đổi cờ Firebase như logic cũ.
         */
        // StoreConcurrency.equipment commits both unequip and equip atomically.
        // Do not mutate DB/runtime here: the user may cancel, lose access, or go offline.

        return true;
    }


    // ========================================================
    // BỌC StoreManager.applyItem()
    // ========================================================

    function installStoreBoundaryEquipGuard(
        attempt = 0
    ) {
        /*
         * Chờ student.js tạo xong
         * applyItem + unapplyItem cuối cùng.
         */
        if (
            typeof StoreManager === 'undefined' ||
            typeof StoreManager.applyItem !==
            'function' ||
            typeof StoreManager.unapplyItem !==
            'function'
        ) {
            if (attempt < 100) {
                setTimeout(
                    () =>
                        installStoreBoundaryEquipGuard(
                            attempt + 1
                        ),
                    100
                );
            }

            return;
        }

        /*
         * Không bọc trùng nhiều lần.
         */
        if (
            StoreManager
                .__storeBoundaryEquipGuardInstalled
        ) {
            return;
        }

        const originalApplyItem =
            StoreManager.applyItem.bind(
                StoreManager
            );

        StoreManager.applyItem =
            async function (itemId) {

                if (window.isStudentStoreGameAccessEnabled?.() === false) return false;
                try {
                    const allowed =
                        await prepareStoreBoundaryEquip(
                            itemId
                        );

                    /*
                     * Người dùng chọn Hủy.
                     */
                    if (!allowed || window.isStudentStoreGameAccessEnabled?.() === false) {
                        return false;
                    }

                    /*
                     * Không xung đột hoặc
                     * người dùng đã đồng ý.
                     */
                    return await originalApplyItem(
                        itemId
                    );

                } catch (error) {
                    console.error(
                        '[LuxuryStore] Lỗi kiểm tra trang bị:',
                        error
                    );

                    alert(
                        '❌ Không thể kiểm tra trạng thái trang bị. ' +
                        'Vui lòng thử lại.'
                    );

                    return false;
                }
            };

        StoreManager
            .__storeBoundaryEquipGuardInstalled =
            true;
    }


    // Đăng ký vào StoreConfig
    // Đăng ký các vật phẩm Luxury thủ công vào StoreConfig.
    // Vật phẩm Quốc khánh được đăng ký ở đây để module sự kiện
    // có thể trao trực tiếp bằng ID mà không cần mua qua cửa hàng.
    if (
        typeof StoreConfig !== 'undefined' &&
        Array.isArray(StoreConfig.items)
    ) {
        [
            SPRING_PREMIUM_PET,
            SUMMER_PREMIUM_PET,
            AUTUMN_PREMIUM_PET,
            HAC_MONG_PREMIUM_PET,
            NATIONAL_DAY_PREMIUM_PET,
            MYTHIC_NYX_PET,
            MYTHIC_AETHER_PET,
            STARRY_NIGHT_PREMIUM_PET,
            LOTM_KLEIN_EVENT_PET,
            CAM_CO_CAM_MONG_PET,
            TAMON_BSIDE_PET,
            TAMON_PINKSTATIC_PET,
            MID_AUTUMN_MOON_PET,
            MID_AUTUMN_CUOI_PET,
            LINKCLICK_CHENG_XIAOSHI_PET
        ].forEach(itemDefinition => {
            const existing = StoreConfig.items.find(
                item =>
                    String(item?.id) ===
                    String(itemDefinition.id)
            );

            if (!existing) {
                StoreConfig.items.push(
                    itemDefinition
                );
                return;
            }

            /*
             * Đồng bộ các trường bất biến của vật phẩm sự kiện.
             * Không để cấu hình giá động biến nó thành vật phẩm Coin.
             */
            if (
                itemDefinition.id ===
                HAC_MONG_PREMIUM_PET.id ||
                itemDefinition.id ===
                AUTUMN_PREMIUM_PET.id ||
                itemDefinition.id ===
                NATIONAL_DAY_PREMIUM_PET.id ||
                itemDefinition.id ===
                LOTM_KLEIN_EVENT_PET.id ||
                itemDefinition.id ===
                CAM_CO_CAM_MONG_PET.id ||
                itemDefinition.id ===
                STARRY_NIGHT_PREMIUM_PET.id ||
                itemDefinition.id ===
                TAMON_BSIDE_PET.id ||
                itemDefinition.id ===
                TAMON_PINKSTATIC_PET.id ||
                itemDefinition.id ===
                MID_AUTUMN_MOON_PET.id ||
                itemDefinition.id ===
                MID_AUTUMN_CUOI_PET.id ||
                itemDefinition.id ===
                LINKCLICK_CHENG_XIAOSHI_PET.id
            ) {
                Object.assign(
                    existing,
                    itemDefinition
                );
            }
        });
    }

    // ========================================================
    // ẨN VẬT PHẨM PREMIUM KHỎI CỬA HÀNG THƯỜNG
    // ========================================================

    if (
        typeof StoreManager !== 'undefined' &&
        !StoreManager.__luxuryFilterInstalled
    ) {
        const originalGetItemsByType =
            StoreManager.getItemsByType.bind(
                StoreManager
            );

        StoreManager.getItemsByType =
            function (type) {

                return originalGetItemsByType(type)
                    .filter(
                        item =>
                            item.luxuryOnly !== true
                    );
            };

        StoreManager.__luxuryFilterInstalled =
            true;
    }


    const IDS = {
        button: 'luxuryStoreOpenButton',
        page: 'luxuryStorePage',
        grid: 'luxuryStoreGrid'
    };

    // ========================================================
    // TRẠNG THÁI KHO RIÊNG CỦA LUXURY STORE
    // ========================================================

    let luxuryInventoryState = {};


    function findInventoryItemById(
        inventory,
        itemId
    ) {
        const wantedId = String(itemId ?? '');

        if (!wantedId) {
            return null;
        }

        if (Array.isArray(inventory)) {
            return inventory.find(
                inv =>
                    String(inv?.id ?? '') ===
                    wantedId
            ) || null;
        }

        if (
            inventory &&
            typeof inventory === 'object'
        ) {
            return Object
                .values(inventory)
                .find(
                    inv =>
                        String(inv?.id ?? '') ===
                        wantedId
                ) || null;
        }

        return null;
    }


    function getLuxuryInventoryItem(itemId) {

        /*
         * Nguồn chính của trang học sinh là window.myInventory.
         * Luxury Store vẫn giữ listener riêng để render tức thời,
         * nhưng không được coi biến local là nguồn duy nhất.
         *
         * Điều này tránh trường hợp module Luxury được lazy-load/reload
         * sau khi inventory chính đã về: card không được phép hiện
         * "Mua" cho món thực tế vẫn còn trong Firebase.
         */
        const mainInventoryItem =
            findInventoryItemById(
                window.myInventory,
                itemId
            );

        if (mainInventoryItem) {
            return mainInventoryItem;
        }

        const bridgeInventoryItem =
            findInventoryItemById(
                window.__luxuryInventoryBridgeState
                    ?.inventory,
                itemId
            );

        if (bridgeInventoryItem) {
            return bridgeInventoryItem;
        }

        return findInventoryItemById(
            luxuryInventoryState,
            itemId
        );
    }


    const luxuryPurchasesInFlight = new Set();
    async function buyLuxuryItemSafely(itemId) {
        const key = String(itemId);
        if (luxuryPurchasesInFlight.has(key)) return false;
        luxuryPurchasesInFlight.add(key);
        try {
            return await buyLuxuryItemChecked(key);
        } finally {
            luxuryPurchasesInFlight.delete(key);
        }
    }

    async function buyLuxuryItemChecked(itemId) {
        let user;
        try { user = JSON.parse(localStorage.getItem('currentUser') || 'null'); }
        catch (_) { user = null; }
        if (typeof db === 'undefined' || !user?.username) {
            alert('Chưa xác định được tài khoản. Vui lòng đăng nhập lại.');
            return false;
        }
        let upgradingFromTrial = false;

        /*
         * Chốt chống mua lại:
         * trước khi gọi luồng thanh toán chung, kiểm tra trực tiếp Firebase.
         * Nếu item đã tồn tại thì chỉ đồng bộ UI, tuyệt đối không trừ Coin lần nữa.
         */
        if (
            typeof db !== 'undefined' &&
            user?.username
        ) {
            try {
                const itemRef =
                    db.ref(
                        `student_inventory/${user.username}/${itemId}`
                    );

                const snapshot =
                    await itemRef.once('value');

                const existingItem =
                    snapshot.val();

                if (existingItem?.isTrial === true) {
                    if (Number(existingItem.trialExpiry || 0) <= Date.now()) {
                        alert('Lượt dùng thử đã hết hạn. Vui lòng chờ kho cập nhật rồi thử lại.');
                        return false;
                    }
                    upgradingFromTrial = true;
                }
                if (
                    existingItem && existingItem.isTrial !== true &&
                    String(existingItem.id ?? '') ===
                        String(itemId)
                ) {
                    luxuryInventoryState = {
                        ...(luxuryInventoryState || {}),
                        [String(itemId)]: existingItem
                    };

                    window.__luxuryInventoryBridgeState = {
                        username:
                            String(user.username),
                        inventory: {
                            ...(
                                window.__luxuryInventoryBridgeState
                                    ?.inventory || {}
                            ),
                            [String(itemId)]:
                                existingItem
                        }
                    };

                    renderLuxuryStore();

                    alert(
                        '✅ Vật phẩm này vẫn đang có trong kho của bạn. ' +
                        'Hệ thống đã đồng bộ lại trạng thái sở hữu.'
                    );

                    return false;
                }
            } catch (error) {
                console.warn(
                    '[LuxuryStore] Không thể kiểm tra quyền sở hữu trước khi mua:',
                    error
                );
                alert('Không kiểm tra được kho vật phẩm. Vui lòng thử lại khi kết nối ổn định.');
                return false;
            }
        }

        if (
            typeof window.buyItem === 'function'
        ) {
            return window.buyItem(itemId, upgradingFromTrial);
        }

        console.error(
            '[LuxuryStore] Không tìm thấy hàm buyItem().'
        );

        return false;
    }


    let localLuxuryInventorySubscription = null;
    if (window.__luxuryInventoryStorageHandler) {
        window.removeEventListener('storage', window.__luxuryInventoryStorageHandler);
    }
    window.__luxuryInventoryStorageHandler = event => {
        if (event.key === 'currentUser' || event.key === null) installLuxuryInventoryListener();
    };
    window.addEventListener('storage', window.__luxuryInventoryStorageHandler);

    function installLuxuryInventoryListener() {

        let user;
        try { user = JSON.parse(localStorage.getItem('currentUser') || 'null'); }
        catch (_) { user = null; }
        const previous = window.__luxuryInventorySubscription;
        if (previous && previous.username !== String(user?.username || '')) {
            previous.ref.off('value', previous.callback);
            window.__luxuryInventorySubscription = null;
            window.__luxuryInventoryListeningUser = null;
            window.__luxuryInventoryBridgeState = null;
            luxuryInventoryState = {};
            hardClearBoundaryPetRuntime();
        }

        /*
         * Nếu Firebase/chủ tài khoản chưa sẵn sàng
         * thì thử lại.
         */
        if (
            typeof db === 'undefined' ||
            !user?.username
        ) {
            setTimeout(
                installLuxuryInventoryListener,
                300
            );

            return;
        }


        const username =
            String(user.username);

        const bridgeState =
            window.__luxuryInventoryBridgeState;

        /*
         * Bản cũ chỉ dùng một boolean global. Nếu luxury-store.js bị nạp lại,
         * module mới có luxuryInventoryState = {} nhưng lại không được gắn
         * listener mới => toàn bộ card bị hiểu nhầm là chưa mua.
         *
         * Bản mới chỉ tái sử dụng listener khi đã có bridge state đúng user.
         * Nếu gặp cờ boolean cũ mà không có bridge dữ liệu, cho phép gắn lại.
         */
        if (
            window.__luxuryInventoryListeningUser ===
                username &&
            bridgeState?.username === username &&
            localLuxuryInventorySubscription === window.__luxuryInventorySubscription &&
            localLuxuryInventorySubscription !== null
        ) {
            luxuryInventoryState =
                bridgeState.inventory || {};

            return;
        }

        window.__luxuryInventoryListeningUser =
            username;

        const inventoryRef =
            db.ref(
                `student_inventory/${username}`
            );

        const subscription = { username, ref: inventoryRef, callback: null };
        if (window.__luxuryInventorySubscription) {
            const old = window.__luxuryInventorySubscription;
            old.ref.off('value', old.callback);
        }
        localLuxuryInventorySubscription = subscription;
        window.__luxuryInventorySubscription = subscription;
        const onInventory = snapshot => {
                if (window.__luxuryInventorySubscription !== subscription) return;
                let activeUser;
                try { activeUser = JSON.parse(localStorage.getItem('currentUser') || 'null'); }
                catch (_) { activeUser = null; }
                if (String(activeUser?.username || '') !== username) {
                    installLuxuryInventoryListener();
                    return;
                }

                luxuryInventoryState =
                    snapshot.val() || {};

                window.__luxuryInventoryBridgeState = {
                    username,
                    inventory:
                        luxuryInventoryState
                };

                // ====================================================
                // Nếu Xuân Thần đã được gỡ trên Firebase
                // thì tuyệt đối không để Runtime Luxury tồn tại.
                // ====================================================

                if (!Object.values(luxuryInventoryState || {}).some(item =>
                    item?.id === AUTUMN_PREMIUM_PET.id && item.isEquipped === true)) {
                    LuxuryAutumnRuntime.clear();
                }

                if (!Object.values(luxuryInventoryState || {}).some(item =>
                    item?.id === HAC_MONG_PREMIUM_PET.id && item.isEquipped === true &&
                    (item.isTrial !== true || Number(item.trialExpiry) > Date.now()))) LuxuryHacMongRuntime.clear();

                const equippedLuxurySpring =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_luxury_mua_xuan' &&
                                item?.isEquipped === true
                        );


                if (!equippedLuxurySpring) {

                    LuxurySpringRuntime.clear();

                    document.documentElement
                        .classList.remove(
                            'premium-spring-sanctuary-equipped'
                        );
                }

                const equippedLuxurySummer =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_luxury_mua_ha' &&
                                item?.isEquipped === true
                        );

                if (!equippedLuxurySummer) {
                    LuxurySummerRuntime.clear();
                }

                const equippedMythicNyx =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_mythic_nyx_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedMythicNyx) {
                    LuxuryNyxRuntime.clear();
                }


                const equippedMythicAether =
                    Object
                        .values(
                            luxuryInventoryState || {}
                        )
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_mythic_aether_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedMythicAether) {
                    LuxuryAetherRuntime.clear();
                }

                const equippedLotmKlein =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_lotm_klein_event_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedLotmKlein) {
                    LuxuryLotmKleinRuntime.clear();
                }

                const equippedCamCoCamMong =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_cam_co_cam_mong_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedCamCoCamMong) {
                    LuxuryCamCoCamMongRuntime.clear();
                }

                const equippedMidAutumnMoonPalace =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                (
                                    String(item?.id) ===
                                        'pet_trung_thu_nguyet_cung_tien_tu' ||
                                    String(item?.id) ===
                                        'pet_trung_thu_chu_cuoi_2'
                                ) &&
                                item?.isEquipped === true
                        );

                if (!equippedMidAutumnMoonPalace) {
                    LuxuryMidAutumnRuntime.clear();
                }

                const equippedStarryNight =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_dem_day_sao_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedStarryNight) {
                    LuxuryStarryNightRuntime.clear();
                }

                const equippedLinkClickCheng =
                    Object
                        .values(luxuryInventoryState || {})
                        .find(
                            item =>
                                String(item?.id) ===
                                'pet_linkclick_cheng_xiaoshi_1' &&
                                item?.isEquipped === true
                        );

                if (!equippedLinkClickCheng) {
                    LuxuryLinkClickChengRuntime.clear();
                }
/*
                 * Khi Firebase thay đổi:
                 * render lại Luxury Store ngay.
                 */
                const page =
                    document.getElementById(
                        IDS.page
                    );

                if (
                    page &&
                    page.hidden !== true
                ) {
                    renderLuxuryStore();
                }
            };
        subscription.callback = onInventory;
        inventoryRef.on('value', onInventory,
            error => {
                if (window.__luxuryInventorySubscription !== subscription) return;
                inventoryRef.off('value', onInventory);
                window.__luxuryInventorySubscription = null;
                console.error(
                    '[LuxuryStore] Lỗi listener kho Luxury:',
                    error
                );

                if (
                    window.__luxuryInventoryListeningUser ===
                    username
                ) {
                    delete window
                        .__luxuryInventoryListeningUser;
                }

                window.setTimeout(
                    installLuxuryInventoryListener,
                    700
                );
            }
        );
    }

    // ========================================================
    // 2. ESCAPE HTML
    // ========================================================
    function escapeHTML(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }


    // ========================================================
    // 3. LẤY DANH SÁCH VẬT PHẨM THỦ CÔNG
    // ========================================================
    function getLuxuryItems() {

        if (
            typeof StoreConfig === 'undefined' ||
            !StoreConfig ||
            !Array.isArray(StoreConfig.items)
        ) {
            return [];
        }

        return StoreConfig.items.filter(item =>
            LUXURY_ITEM_IDS.includes(
                String(item?.id ?? '')
            )
        );
    }


    // ========================================================
    // 4. TẠO CARD
    // ========================================================
    // One full-art layout for the Luxury catalog. The original renderer remains
    // the source of purchase/equip/event controls, including seasonal currency.
    const LUXURY_CARD_PRESENTATION = Object.freeze({
        pet_hac_mong_2: ['#173e43', '#d2e9d8', 'Nương cánh hạc vượt tầng mây, nàng mang ngọc khí và ánh trăng về tiên cảnh. Mỗi bước chân đánh thức một khúc vân ca.'],
        pet_luxury_mua_xuan: ['#24402b', '#d9edb2', 'Nàng xuân đánh thức muôn hoa, mang sức sống dịu dàng và sắc xanh mơ mộng đến từng ngày học.'],
        pet_luxury_mua_ha: ['#49320e', '#ffe096', 'Hạ Thần gom nắng vào những dải lưu kim, mở ra một mùa hè rực rỡ giữa gió và hoa.'],
        pet_luxury_mua_thu: ['#361c10', '#edb96b', 'Thu Thần dệt lá phong và ánh hổ phách thành một miền thu huyền ảo, nơi ngàn chiếc lá cùng tỏa sáng.'],
        pet_quoc_khanh_1: ['#541718', '#ffdf8c', 'Sắc cờ đỏ hòa cùng ánh sao vàng, gìn giữ niềm tự hào và khí phách của một ngày độc lập.'],
        pet_mythic_nyx_1: ['#211538', '#cbb3ff', 'Nữ thần màn đêm khoác dải ngân hà, dẫn lối qua miền tinh tú và những bí mật của vĩnh dạ.'],
        pet_mythic_aether_1: ['#343548', '#ffe4a6', 'Ánh sáng nguyên sơ kết thành hào quang, đưa đôi cánh thiên giới xuyên qua tầng mây rực rỡ.'],
        pet_dem_day_sao_1: ['#122d45', '#f3d184', 'Lữ khách bước ra từ bức họa đêm sao, mang theo những nét cọ xoáy và giấc mơ xanh thẳm.'],
        pet_lotm_klein_event_1: ['#28202d', '#dbbd8b', 'Giữa màn sương xám và những lá bài định mệnh, Klein mở cánh cửa dẫn vào thế giới huyền bí.'],
        pet_cam_co_cam_mong_1: ['#153d32', '#b9e4ce', 'Một tiếng đàn khẽ lay tiên cảnh; Lạc Thanh Huyền đưa mây ngọc và mộng thanh bình về bên bạn.'],
        pet_tamon_b_side_1: ['#381b30', '#f8b6d6', 'Ánh đèn sân khấu bừng lên theo nhịp nhạc, hé lộ vẻ cuốn hút và một mặt khác của Tamon.'],
        pet_tamon_b_side_2: ['#291b30', '#ffb4d5', 'Những nhịp sóng hồng và sắc đêm tinh nghịch hòa thành sân khấu riêng của Hắc Miêu Thiếu Niên.'],
        pet_trung_thu_nguyet_cung_tien_tu: ['#25324c', '#ffe0a2', 'Tiên tử rời Nguyệt Cung, mang ánh trăng trong trẻo và lời chúc đoàn viên xuống nhân gian.'],
        pet_trung_thu_chu_cuoi_2: ['#243b32', '#e4d29a', 'Dưới bóng nguyệt quế, Chú Cuội gọi trăng rằm và hoa đăng thắp sáng một đêm thu ấm áp.'],
        pet_linkclick_cheng_xiaoshi_1: ['#172f3a', '#99e7dc', 'Cheng Xiaoshi bước qua khung ảnh, lần theo dấu thời gian và những ký ức còn ngân trong ánh sáng.']
    });

    // Native vector scenery: stays behind the character and needs no extra image assets.
    function renderLuxuryBackdrop(itemId) {
        const ring = (x, y, r) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
        const rays = (x, y, count, inner, outer) => Array.from({length:count}, (_,i) => {
            const a=i*Math.PI*2/count;
            return `<path d="M${x+Math.cos(a)*inner} ${y+Math.sin(a)*inner}L${x+Math.cos(a)*outer} ${y+Math.sin(a)*outer}"/>`;
        }).join('');
        const moon = '<path class="luxury-scene-solid" d="M244 18a61 61 0 1 0 25 107a52 52 0 0 1-25-107Z"/>';
        const hills = '<path d="M-20 344Q63 248 151 338T327 312M-20 362Q108 288 202 360T331 337M-20 385Q82 327 185 385T324 356"/>';
        const branches = '<path d="M-5 260Q49 182 20 25M20 122Q66 108 88 49M16 66Q56 67 74 31M6 197Q66 178 99 122M308 281Q239 184 281 8M276 107Q232 97 212 44M289 210Q239 188 214 133"/>';
        const leaves = Array.from({length:9},(_,i)=>`<path class="luxury-scene-solid" d="M${18+i%2*9} ${40+i*22}q-23-18-12-33q26 5 12 33Zm${254+i%2*9} ${32+i*24}q27-15 24-31q-29 1-24 31Z"/>`).join('');
        const stars = Array.from({length:25},(_,i)=>`<circle class="luxury-scene-star" cx="${(i*79+19)%292}" cy="${(i*47+23)%380}" r="${i%4===0?2.1:1}"/>`).join('');
        const arch = '<path d="M28 398V154Q28 32 150 8Q272 32 272 154V398M44 398V156Q44 51 150 26Q256 51 256 156V398M12 398V156M288 398V156M8 156H54M246 156H292"/>';
        const lanterns = '<path d="M42 0V80M257 0V125"/><g class="luxury-scene-solid"><rect x="26" y="78" width="32" height="44" rx="13"/><rect x="241" y="122" width="32" height="44" rx="13"/></g><path d="M42 83V118M30 89H54M30 111H54M42 124V142M257 127V162M245 133H269M245 155H269M257 168V186"/>';
        const clock = ring(150,130,111)+ring(150,130,99)+rays(150,130,12,88,97)+'<path d="M150 56V130L206 162"/>';
        const flowers = Array.from({length:7},(_,i)=>`<g transform="translate(${i%2?270:30} ${55+i*45})"><circle r="8"/><path d="M0-8C-24-33-33 8-8 0C-32 28 12 33 0 8C26 33 36-11 8 0C35-23-12-36 0-8Z"/></g>`).join('');
        const scenes = {
            pet_luxury_mua_xuan: ['spring',branches+leaves+flowers+hills],
            pet_luxury_mua_ha: ['summer',ring(208,78,42)+ring(208,78,55)+rays(208,78,24,61,93)+hills+'<path d="M-20 282Q112 197 321 280M-20 293Q112 208 321 291"/>'],
            pet_hac_mong_2: ['hacmong',moon+stars+arch+branches+hills],
            pet_luxury_mua_thu: ['autumn',branches+leaves+ring(170,152,110)+ring(170,152,120)+rays(170,152,32,112,118)+hills],
            pet_quoc_khanh_1: ['heritage',ring(150,132,105)+ring(150,132,89)+ring(150,132,64)+rays(150,132,24,91,102)+'<path class="luxury-scene-solid" d="M150 60L168 109L220 112L179 144L193 195L150 166L107 195L121 144L80 112L132 109Z"/>'+hills],
            pet_mythic_nyx_1: ['night',moon+stars+arch+'<path d="M28 65L88 95L53 170L111 215M238 191L270 244L221 280L278 331"/>'],
            pet_mythic_aether_1: ['heaven',arch+ring(150,84,56)+rays(150,84,32,60,88)+'<path d="M0 312Q45 274 90 309Q148 260 198 306Q248 278 300 307M0 333Q80 299 146 328T300 325"/>'],
            pet_dem_day_sao_1: ['painting',moon+stars+'<path d="M-10 154C88 45 275 187 193 239C103 292 38 180 125 159C223 135 277 266 322 155M-10 166C76 72 260 185 184 225C117 268 67 190 129 176C214 155 265 275 327 180M-10 178C74 96 240 185 174 210M18 355Q23 248 35 219Q34 293 56 356"/>'+hills],
            pet_lotm_klein_event_1: ['mystery',clock+arch+'<g transform="rotate(-15 43 302)"><rect x="8" y="248" width="70" height="108" rx="6"/><rect x="15" y="255" width="56" height="94" rx="3"/></g><path d="M26 283L57 318M57 283L26 318M248 257V375M258 246V392M268 264V375"/>'],
            pet_cam_co_cam_mong_1: ['jade',moon+branches+flowers+'<path d="M-10 270L72 219L142 265L211 220L311 277M10 285L66 250L115 288M14 180Q51 154 92 178T192 168M208 329Q247 303 290 323"/>'+hills],
            pet_tamon_b_side_1: ['stage',rays(150,-50,14,70,470)+'<path d="M18 399V280M34 399V330M50 399V298M66 399V351M82 399V308M218 399V305M234 399V345M250 399V282M266 399V327M282 399V271"/>'+stars],
            pet_tamon_b_side_2: ['pink',stars+'<g transform="rotate(-13 150 140)"><rect x="18" y="35" width="264" height="190" rx="24"/><rect x="32" y="49" width="236" height="161" rx="15"/>'+ring(78,127,33)+ring(220,127,33)+'<path d="M77 94H220M77 160H220M95 202L110 174H190L207 202"/></g><path d="M-10 320L32 292L48 341L77 301L95 325M211 305L236 336L253 289L277 329L316 304"/>'],
            pet_trung_thu_nguyet_cung_tien_tu: ['palace',ring(165,92,69)+ring(165,92,76)+lanterns+'<path d="M53 296V235L150 165L247 235V296M32 237Q151 202 268 237M67 211Q151 178 233 211M107 198V295M194 198V295"/>'+hills],
            pet_trung_thu_chu_cuoi_2: ['moonwood',moon+branches+leaves+lanterns+hills],
            pet_linkclick_cheng_xiaoshi_1: ['time',clock+'<g transform="rotate(-10 150 240)"><rect x="-12" y="75" width="324" height="334" rx="7"/><path d="M10 75V409M290 75V409M-12 102H10M-12 134H10M-12 166H10M-12 198H10M-12 230H10M-12 262H10M290 102H312M290 134H312M290 166H312M290 198H312M290 230H312M290 262H312"/></g>']
        };
        const [kind, art] = scenes[itemId] || ['night',stars+arch];
        return `<div class="luxury-scene luxury-scene-${kind}" aria-hidden="true"><span class="luxury-scene-glow"></span><svg viewBox="0 0 300 430" preserveAspectRatio="xMidYMid slice" fill="none" stroke="currentColor" stroke-width="1.2">${art}</svg><span class="luxury-scene-grain"></span></div>`;
    }

    function renderCard(item) {
        const original = renderLuxuryCardControls(item);
        // Teacher locks must remain opaque and must not reveal item details.
        if (item.isLocked === true) return original;
        const template = document.createElement('template');
        template.innerHTML = original;
        const oldCard = template.content.querySelector('article');
        if (!oldCard) return original;
        const [shade, accent, introduction] = LUXURY_CARD_PRESENTATION[item.id] ||
            ['#252338', '#e4c48d', String(item.description || 'Người bạn đồng hành đặc biệt trong bộ sưu tập sang trọng.')];
        const source = oldCard.querySelector('.luxury-product-price, [class$="-price"], [class$="-source"]');
        const buttons = Array.from(oldCard.querySelectorAll('button')).map(button => {
            const equipped = button.classList.contains('is-equipped');
            button.className = 'luxury-unified-action' + (equipped ? ' is-equipped' : '');
            button.removeAttribute('style');
            return button.outerHTML;
        }).join('');
        const name = escapeHTML(item.name || 'Vật phẩm');
        const tag = escapeHTML(item.tag || 'Premium');
        const image = escapeHTML(item.image || item.asset || item.value || '');
        const tagImage = escapeHTML(item.luxuryTagImage || '');
        const id = escapeHTML(item.id);
        return `<article class="luxury-product-card luxury-unified-card store-theme-locked ui-theme-immune"
            data-item-id="${id}" data-theme-immune="true" tabindex="0" aria-label="${name}"
            style="--luxury-card-shade:${shade};--luxury-card-accent:${accent}">
            <div class="luxury-unified-visual">
                ${renderLuxuryBackdrop(item.id)}
                <img class="luxury-unified-character" src="${image}" alt="${name}" draggable="false" loading="lazy">
                <span class="luxury-unified-frame" aria-hidden="true"></span>
                ${tagImage ? `<img class="luxury-unified-tag" src="${tagImage}" alt="${tag}" draggable="false" loading="lazy">` : ''}
                <div class="luxury-unified-info">
                    <span class="luxury-unified-label">${tag} · PREMIUM</span>
                    <h3>${name}</h3>
                    <p class="luxury-unified-intro">${escapeHTML(introduction)}</p>
                    <div class="luxury-unified-price">${source ? source.innerHTML : 'Vật phẩm đặc biệt'}</div>
                    <div class="luxury-unified-actions">${buttons}</div>
                </div>
            </div>
        </article>`;
    }

    function renderLuxuryCardControls(item) {

        const name =
            escapeHTML(
                item.name || 'Vật phẩm'
            );

        const image =
            escapeHTML(
                item.image ||
                item.asset ||
                item.value ||
                ''
            );

        const id =
            escapeHTML(item.id);

        // ====================================================
        // KHÓA BỞI GIÁO VIÊN · HOTFIX v4.0.1
        // Chỉ render một placeholder khóa duy nhất.
        // Không render ảnh / tên / nút của vật phẩm ở phía dưới.
        // ====================================================
        if (item.isLocked === true) {
            return `
                <article
                    class="
                        luxury-product-card
                        luxury-teacher-locked-card
                        is-teacher-locked
                        ui-theme-immune
                    "
                    data-locked-by-teacher="true"
                    aria-label="Vật phẩm đang cập nhật, sẽ xuất hiện trong tương lai"
                >
                    <div
                        class="store-teacher-lock-overlay"
                        role="status"
                        title="Vật phẩm đang cập nhật, sẽ xuất hiện trong tương lai"
                    >
                        <div class="store-teacher-lock-content">
                            <span
                                class="store-teacher-lock-question"
                                aria-hidden="true"
                            >?</span>

                            <strong>
                                Vật phẩm đang cập nhật
                            </strong>

                            <small>
                                Sẽ xuất hiện trong tương lai.
                            </small>
                        </div>
                    </div>
                </article>
            `;
        }

        const inventoryItem =
            getLuxuryInventoryItem(item.id);

        const isOwned = Boolean(inventoryItem) &&
            (inventoryItem.isTrial !== true || Number(inventoryItem.trialExpiry || 0) > Date.now());

        const isEquipped =
            isOwned && inventoryItem?.isEquipped === true;

        // ====================================================
        // CARD RIÊNG QUỐC KHÁNH
        // Hoàn toàn độc lập với card Mùa Xuân và theme toàn web.
        // ====================================================
        if (item.id === 'pet_quoc_khanh_1') {

            const tagImage = escapeHTML(
                item.luxuryTagImage || ''
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
            <button
                type="button"
                class="
                    national-day-premium-use-button
                    national-day-premium-event-button
                "
                disabled
                aria-disabled="true"
            >
                🎁 Nhận từ sự kiện · 10/10
            </button>
        `;
            } else if (isEquipped) {
                actionHTML = `
            <button
                type="button"
                class="
                    national-day-premium-use-button
                    is-equipped
                "
                onclick="
                    StoreManager.unapplyItem(
                        '${id}'
                    )
                "
            >
                ✕ Gỡ
            </button>
        `;
            } else {
                actionHTML = `
            <button
                type="button"
                class="national-day-premium-use-button"
                onclick="
                    StoreManager.applyItem(
                        '${id}'
                    )
                "
            >
                ★ Sử dụng
            </button>
        `;
            }

            return `
        <article
            class="
                luxury-product-card
                national-day-premium-card
                store-theme-locked
                ui-theme-immune
            "
            data-item-id="${id}"
            data-theme-immune="true"
            data-luxury-style="national-day"
            tabindex="0"
        >
            <div class="national-day-premium-card__visual">

                <div class="nd-card-lacquer"></div>
                <div class="nd-card-drum-disc"></div>
                <div class="nd-card-drum-ring ring-a"></div>
                <div class="nd-card-drum-ring ring-b"></div>

                <div
                    class="nd-card-rays"
                    aria-hidden="true"
                ></div>

                <div
                    class="nd-card-bronze-field"
                    aria-hidden="true"
                >
                    <i style="--i:0"></i>
                    <i style="--i:1"></i>
                    <i style="--i:2"></i>
                    <i style="--i:3"></i>
                    <i style="--i:4"></i>
                    <i style="--i:5"></i>
                    <i style="--i:6"></i>
                    <i style="--i:7"></i>
                    <i style="--i:8"></i>
                    <i style="--i:9"></i>
                    <i style="--i:10"></i>
                    <i style="--i:11"></i>
                </div>

                ${tagImage
                    ? `
                        <div
                            class="national-day-premium-tag-shell"
                            aria-hidden="true"
                        >
                            <img
                                src="${tagImage}"
                                alt="Quốc khánh"
                                class="national-day-premium-tag"
                                draggable="false"
                            >
                        </div>
                    `
                    : ''
                }

                <img
                    src="${image}"
                    alt="${name}"
                    class="national-day-premium-character"
                    draggable="false"
                >

                <div class="national-day-premium-details">
                    <div class="national-day-premium-type">
                        🇻🇳 THÚ CƯNG PREMIUM · QUỐC KHÁNH
                    </div>

                    <h3>${name}</h3>

                    <p class="national-day-premium-description">
    Linh thú Quốc khánh mang biểu tượng
    hồn thiêng sông núi, khí phách dân tộc
    và ánh sáng độc lập của Việt Nam.
</p>

                    <div class="national-day-premium-source">
                        🎖️ Phần thưởng Lịch sử hào hùng · Mốc 10/10
                    </div>

                    ${actionHTML}
                </div>
            </div>
        </article>
    `;
        }



        // ====================================================
        // CARD LORD OF THE MYSTERIES · KLEIN
        // Giữ nguyên bố cục chuẩn Luxury:
        // visual -> info -> label -> title -> price/source -> action.
        // Chỉ skin riêng bằng CSS, không đổi flow/kích thước của grid.
        // ====================================================
        if (item.id === 'pet_lotm_klein_event_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/quỷ bí/tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action"
                        disabled
                        aria-disabled="true"
                        title="Vật phẩm này chỉ nhận từ sự kiện Lord of the Mysteries"
                    >
                        🎁 Nhận từ sự kiện
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="lotm-klein-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ◈ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card lotm-klein-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="lotm-klein-event-premium"
                    data-theme-immune="true"
                    data-luxury-style="lotm-klein-event"
                    tabindex="0"
                >
                    <div class="luxury-product-visual lotm-klein-card-visual">
                        <div class="luxury-product-shape lotm-klein-card-shape"></div>
                        <div class="lotm-klein-card-fog" aria-hidden="true"></div>
                        <div class="lotm-klein-card-clock" aria-hidden="true"></div>
                        <div class="lotm-klein-card-eye" aria-hidden="true"></div>

                        <div
                            class="lotm-klein-card-tag"
                            aria-label="Lord of the Mysteries"
                        >
                            <img
                                src="${tagImage}"
                                alt="Lord of the Mysteries"
                                class="lotm-klein-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image lotm-klein-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info lotm-klein-card-info">
                        <span class="luxury-product-label lotm-klein-card-label">
                            LORD OF THE MYSTERIES
                        </span>

                        <h3>${name}</h3>

                        <div class="luxury-product-price lotm-klein-card-price">
                            🎁 Phần thưởng sự kiện
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD CẦM CƠ · CẦM MỘNG
        // Đồng bộ cấu trúc Premium đang dùng trong cùng grid:
        // article -> visual toàn thẻ -> tag/nhân vật -> details overlay.
        // Details ẩn mặc định, trượt lên khi hover/focus giống các thẻ Premium khác.
        // Card khóa theme để không bị vật phẩm giao diện khác nhuộm màu.
        // ====================================================
        if (item.id === AUTUMN_PREMIUM_PET.id) {
            ensureAutumnStylesheet();
            const price = Number(item.price).toLocaleString('vi-VN');
            const action = !isOwned
                ? `window.LuxuryStore.buyItemSafely('${id}')`
                : isEquipped ? `StoreManager.unapplyItem('${id}')` : `StoreManager.applyItem('${id}')`;
            const label = !isOwned ? `🪙 Mua ${price} Coin` : isEquipped ? '✕ Gỡ' : '✦ Sử dụng';
            return `<article class="luxury-product-card autumn3-card store-theme-locked ui-theme-immune"
                data-item-id="${id}" data-special-card="autumn3-premium" data-theme-immune="true"
                data-luxury-style="autumn3" tabindex="0" aria-label="${name}">
                <div class="autumn3-card-visual">
                    <div class="autumn3-card-halo" aria-hidden="true"></div>
                    <img class="autumn3-card-character" src="${image}" alt="${name}" draggable="false" loading="lazy">
                    <img class="autumn3-card-tag" src="${escapeHTML(item.luxuryTagImage)}" alt="Mùa thu" draggable="false">
                    <div class="autumn3-card-leaves" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></div>
                    <div class="autumn3-card-info">
                        <span class="autumn3-card-label">BỐN MÙA · MÙA THU</span>
                        <h3>${name}</h3><div class="autumn3-card-price">🪙 ${price} Coin</div>
                        <button type="button" class="autumn3-card-action${isEquipped ? ' is-equipped' : ''}" onclick="${action}">${label}</button>
                    </div>
                </div>
            </article>`;
        }

        if (item.id === HAC_MONG_PREMIUM_PET.id) {
            ensureHacMongStylesheet();
            const price = Number(item.price).toLocaleString('vi-VN');
            const action = !isOwned
                ? `window.LuxuryStore.buyItemSafely('${id}')`
                : isEquipped ? `StoreManager.unapplyItem('${id}')` : `StoreManager.applyItem('${id}')`;
            const label = !isOwned ? `🪙 Mua ${price} Coin` : isEquipped ? '✕ Gỡ' : '✦ Sử dụng';
            return `<article class="luxury-product-card hacmong2-card store-theme-locked ui-theme-immune"
                data-item-id="${id}" data-special-card="hacmong2-premium" data-theme-immune="true"
                data-luxury-style="hacmong2" tabindex="0" aria-label="${name}">
                <div class="hacmong2-card-visual">
                    <div class="hacmong2-card-halo" aria-hidden="true"></div>
                    <img class="hacmong2-card-character" src="${image}" alt="${name}" draggable="false" loading="lazy">
                    <img class="hacmong2-card-tag" src="${escapeHTML(item.luxuryTagImage)}" alt="Hạc Mộng" draggable="false">
                    <div class="hacmong2-card-leaves" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i></div>
                    <div class="hacmong2-card-info">
                        <span class="hacmong2-card-label">TU TIÊN · HẠC MỘNG</span>
                        <h3>${name}</h3><div class="hacmong2-card-price">🪙 ${price} Coin</div>
                        <button type="button" class="hacmong2-card-action${isEquipped ? ' is-equipped' : ''}" onclick="${action}">${label}</button>
                    </div>
                </div>
            </article>`;
        }

        if (item.id === 'pet_cam_co_cam_mong_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tu tiên/cam_co_tag1.png'
            );

            const price = Number(item.price) || 12000;
            const formattedPrice = price.toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action cam-co-cam-mong-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="cam-co-cam-mong-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ♪ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card cam-co-cam-mong-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="cam-co-cam-mong-premium"
                    data-theme-immune="true"
                    data-luxury-style="cam-co-cam-mong"
                    tabindex="0"
                >
                    <div class="cam-co-cam-mong-card-visual">
                        <div class="cam-co-cam-mong-card-shape" aria-hidden="true"></div>
                        <div class="cam-co-card-moon" aria-hidden="true"></div>
                        <div class="cam-co-card-qin" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="cam-co-card-cloud cloud-a" aria-hidden="true"></div>
                        <div class="cam-co-card-cloud cloud-b" aria-hidden="true"></div>

                        <div class="cam-co-cam-mong-tag" aria-label="Cầm Mộng">
                            <img
                                src="${tagImage}"
                                alt="Cầm Mộng"
                                class="cam-co-cam-mong-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="cam-co-cam-mong-character"
                            draggable="false"
                        >

                        <div class="cam-co-cam-mong-card-info">
                            <span class="cam-co-cam-mong-card-label">
                                CẦM MỘNG · TU TIÊN
                            </span>

                            <h3>${name}</h3>

                            <div class="cam-co-cam-mong-card-price">
                                🪙 ${formattedPrice} Coin
                            </div>

                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG TAMON'S B-SIDE
        // Dùng CHÍNH bố cục card Luxury thường:
        // visual -> info -> label -> title -> price -> action.
        // Chỉ skin bằng CSS riêng, không đổi kích thước / flow của grid.
        // ====================================================
        if (item.id === 'pet_tamon_b_side_1') {

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tamon/tamon-tag1.png'
            );

            const price =
                Number(item.price) || 15000;

            const formattedPrice =
                price.toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action tamon-bside-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-bside-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card tamon-bside-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="tamon-b-side-premium"
                    data-theme-immune="true"
                    data-luxury-style="tamon-b-side"
                    tabindex="0"
                >
                    <div class="luxury-product-visual tamon-bside-card-visual">
                        <div class="luxury-product-shape tamon-bside-card-shape"></div>
                        <div class="tamon-bside-card-eq" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>

                        <div class="tamon-bside-card-tag" aria-label="Tamon's B-Side">
                            <img
                                src="${tagImage}"
                                alt="Tamon's B-Side"
                                class="tamon-bside-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image tamon-bside-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info tamon-bside-card-info">
                        <span class="luxury-product-label tamon-bside-card-label">
                            TAMON'S B-SIDE
                        </span>

                        <h3>${name}</h3>

                        <div class="luxury-product-price tamon-bside-card-price">
                            🪙 ${formattedPrice} Coin
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }



        // ====================================================
        // CARD TAMON · PINK STATIC
        // Giữ ĐÚNG flow Luxury: visual -> info -> label -> title -> price -> action.
        // Chỉ đổi skin bằng namespace tamon-pinkstatic-*.
        // ====================================================
        if (item.id === 'pet_tamon_b_side_2') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Tamon/tamon-tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action tamon-pinkstatic-event-lock"
                        disabled
                        title="Vật phẩm này nhận từ sự kiện"
                    >
                        🎁 Nhận từ sự kiện
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="tamon-pinkstatic-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card tamon-pinkstatic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="tamon-pink-static-premium"
                    data-theme-immune="true"
                    data-luxury-style="tamon-pink-static"
                    tabindex="0"
                >
                    <div class="luxury-product-visual tamon-pinkstatic-card-visual">
                        <div class="luxury-product-shape tamon-pinkstatic-card-shape"></div>
                        <div class="tamon-pinkstatic-card-tape" aria-hidden="true"></div>
                        <div class="tamon-pinkstatic-card-eq" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>

                        <div class="tamon-pinkstatic-card-tag" aria-label="Tamon's B-Side">
                            <img
                                src="${tagImage}"
                                alt="Tamon's B-Side"
                                class="tamon-pinkstatic-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image tamon-pinkstatic-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info tamon-pinkstatic-card-info">
                        <span class="luxury-product-label tamon-pinkstatic-card-label">
                            TAMON'S B-SIDE
                        </span>
                        <h3>${name}</h3>
                        <div class="luxury-product-price tamon-pinkstatic-card-price">
                            🎁 Phần thưởng sự kiện
                        </div>
                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG AETHER · THẦN THOẠI
        // Đồng bộ bố cục Premium full-art đang đứng cạnh Aether:
        // article -> visual toàn thẻ -> tag/nhân vật -> details overlay.
        // Details trượt lên khi hover/focus; outer card không cao hơn các thẻ khác.
        // ====================================================
        if (item.id === 'pet_mythic_aether_1') {
            ensureAetherStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Thần thoại/aether-tag2.png'
            );
            const formattedPrice =
                Number(item.price || 15000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action aether-mythic-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="aether-mythic-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ✦ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card aether-mythic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="mythic-aether"
                    data-theme-immune="true"
                    data-luxury-style="mythic-aether"
                    tabindex="0"
                >
                    <div class="aether-mythic-visual">
                        <div class="aether-card-shape"></div>
                        <div class="aether-card-sun" aria-hidden="true">
                            <i class="ring ring-a"></i>
                            <i class="ring ring-b"></i>
                            <i class="ring ring-c"></i>
                        </div>
                        <div class="aether-card-stars" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                            <i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="aether-card-veil" aria-hidden="true"></div>

                        <img
                            src="${tagImage}"
                            alt="Thần thoại"
                            class="aether-mythic-tag-art"
                            draggable="false"
                        >

                        <img
                            src="${image}"
                            alt="${name}"
                            class="aether-mythic-character"
                            draggable="false"
                        >

                        <div class="aether-mythic-info">
                            <span class="aether-mythic-label">
                                ✦ THÚ CƯNG PREMIUM · THẦN THOẠI
                            </span>
                            <h3>${name}</h3>
                            <p class="aether-mythic-description">
                                Thần bầu trời sáng, kết tinh của thiên quang nguyên sơ; khi đồng hành sẽ mở ra Thánh Vực Thiên Quang rực rỡ trên toàn website.
                            </p>
                            <div class="aether-mythic-price">
                                🪙 Giá bán: ${formattedPrice} Coin
                            </div>
                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG · ĐÊM ĐẦY SAO
        // Vẫn dùng cấu trúc chuẩn: article -> visual -> info -> action.
        // Card tự khóa theme để không bị skin giao diện khác nhuộm màu.
        // ====================================================
        if (item.id === 'pet_dem_day_sao_1') {
            ensureStarryNightStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/đêm đầy sao/tag.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action starry-night-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="starry-night-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ✦ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card starry-night-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="starry-night-premium"
                    data-theme-immune="true"
                    data-luxury-style="starry-night"
                    tabindex="0"
                >
                    <div class="luxury-product-visual starry-night-card-visual">
                        <div class="luxury-product-shape starry-night-card-shape"></div>
                        <div class="starry-night-card-swirls" aria-hidden="true"></div>
                        <div class="starry-night-card-stars" aria-hidden="true">
                            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
                        </div>
                        <div class="starry-night-card-hills" aria-hidden="true"></div>

                        <div class="starry-night-card-tag" aria-label="Đêm đầy sao">
                            <img
                                src="${tagImage}"
                                alt="Đêm đầy sao"
                                class="starry-night-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image starry-night-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info starry-night-card-info">
                        <span class="luxury-product-label starry-night-card-label">
                            ✦ THÚ CƯNG PREMIUM · ĐÊM ĐẦY SAO
                        </span>
                        <h3>${name}</h3>
                        <p class="starry-night-card-description">
                            Bầu trời xoáy sắc cobalt và vàng kim, lấy cảm hứng từ nhịp cọ giàu chuyển động của “Đêm đầy sao”.
                        </p>
                        <div class="luxury-product-price starry-night-card-price">
                            🪙 Giá bán: ${formattedPrice} Coin
                        </div>
                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG NYX · THẦN THOẠI
        // Namespace riêng: nyx-mythic-*
        // Không dùng class card của Mùa Xuân / Quốc khánh.
        // ====================================================
        if (item.id === 'pet_mythic_nyx_1') {

            ensureNyxStylesheet();

            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Thần thoại/nyx-tag1.png'
            );

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action nyx-mythic-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua 12.000 Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="nyx-mythic-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ☾ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card nyx-mythic-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="mythic-nyx"
                    data-theme-immune="true"
                    data-luxury-style="mythic-nyx"
                    tabindex="0"
                >
                    <div class="nyx-mythic-visual">
                        <div class="nyx-mythic-nightglass" aria-hidden="true"></div>
                        <div class="nyx-mythic-eclipse" aria-hidden="true">
                            <span class="nyx-mythic-eclipse-core"></span>
                            <span class="nyx-mythic-eclipse-ring ring-a"></span>
                            <span class="nyx-mythic-eclipse-ring ring-b"></span>
                        </div>

                        <div class="nyx-mythic-constellation" aria-hidden="true">
                            <i style="--i:0"></i><i style="--i:1"></i>
                            <i style="--i:2"></i><i style="--i:3"></i>
                            <i style="--i:4"></i><i style="--i:5"></i>
                            <i style="--i:6"></i><i style="--i:7"></i>
                            <i style="--i:8"></i><i style="--i:9"></i>
                            <i style="--i:10"></i><i style="--i:11"></i>
                        </div>

                        <div
    class="nyx-mythic-tag"
    aria-label="Thần thoại"
>
    <img
        src="${tagImage}"
        alt="Thần thoại"
        class="nyx-mythic-tag-art"
        draggable="false"
    >
</div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="nyx-mythic-character"
                            draggable="false"
                        >

                        <div class="nyx-mythic-details">
                            <div class="nyx-mythic-type">☾ THÚ CƯNG PREMIUM · THẦN THOẠI</div>
                            <h3>${name}</h3>
                            <p>
                                Quyền năng của màn đêm nguyên sơ: nguyệt thực,
                                tinh tú và những dải bóng tối chuyển động quanh Nyx.
                            </p>
                            <div class="nyx-mythic-price">🪙 Giá bán: 12.000 Coin</div>
                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }



        // ====================================================
        // CARD RIÊNG LINK CLICK · CHENG XIAOSHI
        // Giữ nguyên bố cục card chuẩn: visual -> info -> action.
        // Chỉ đổi skin/thành phần trang trí bên trong card này.
        // ====================================================
        if (item.id === 'pet_linkclick_cheng_xiaoshi_1') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Lock/tag1.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action linkclick-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="linkclick-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card linkclick-premium-card store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="linkclick-cheng-xiaoshi"
                    data-theme-immune="true"
                    data-luxury-style="linkclick"
                    tabindex="0"
                >
                    <div class="luxury-product-visual linkclick-card-visual">
                        <div class="luxury-product-shape linkclick-card-shape"></div>
                        <div class="linkclick-card-grid" aria-hidden="true"></div>
                        <div class="linkclick-card-focus" aria-hidden="true"></div>
                        <div class="linkclick-card-film film-a" aria-hidden="true"></div>
                        <div class="linkclick-card-film film-b" aria-hidden="true"></div>

                        <div class="linkclick-card-tag" aria-label="Link Click">
                            <img
                                src="${tagImage}"
                                alt="Link Click"
                                class="linkclick-card-tag-art"
                                draggable="false"
                            >
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image linkclick-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info linkclick-card-info">
                        <span class="luxury-product-label linkclick-card-label">
                            LINK CLICK · PREMIUM PET
                        </span>

                        <h3>${name}</h3>

                        <p class="linkclick-card-description">
                            Hiệu ứng Thời Quang Ảnh Quán: khung ảnh, màn trập,
                            timecode và chuyển động thời gian phủ toàn website.
                        </p>

                        <div class="luxury-product-price linkclick-card-price">
                            🪙 ${formattedPrice} Coin
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG TRUNG THU · NGUYỆT CUNG TIÊN TỬ — V3
        // Đồng bộ flow với card TAMON'S B-SIDE:
        // visual -> info panel -> label -> title -> price -> action.
        // Không dùng details gradient phủ toàn chiều ngang nhân vật nữa.
        // ====================================================
        if (
            item.id === 'pet_trung_thu_nguyet_cung_tien_tu' ||
            item.id === 'pet_trung_thu_chu_cuoi_2'
        ) {
            const isCuoi =
                item.id === 'pet_trung_thu_chu_cuoi_2';
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Trung thu/tag1.png'
            );

            const specialCardKey =
                isCuoi
                    ? 'midautumn-cuoi-premium'
                    : 'midautumn-moon-palace-premium';

            const cardVariantClass =
                isCuoi
                    ? 'midautumn-cuoi-premium-card'
                    : '';

            const cardStyleKey =
                isCuoi
                    ? 'midautumn-cuoi'
                    : 'midautumn-moon-palace';

            const cardLabel =
                isCuoi
                    ? 'TRUNG THU · NGUYỆT QUẾ'
                    : 'TRUNG THU · NGUYỆT CUNG';

            const cardIntro =
                isCuoi
                    ? 'Chú Cuội dưới bóng nguyệt quế, gọi trăng rằm và hoa đăng về khắp nhân gian.'
                    : 'Tiên tử Nguyệt Cung, mang ánh trăng đoàn viên xuống nhân gian.';

            const midAutumnCoinPrice =
                Number(item.midAutumnCoinPrice || 2);

            const currentMidAutumnBalance =
                window.MidAutumnCoinManager
                    ? window.MidAutumnCoinManager.getBalance()
                    : 0;

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action midautumn-card-buy"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🌕 Đổi ${midAutumnCoinPrice} Xu Trung Thu
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="midautumn-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ▶ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="luxury-product-card midautumn-premium-card ${cardVariantClass} store-theme-locked ui-theme-immune"
                    data-item-id="${id}"
                    data-special-card="${specialCardKey}"
                    data-theme-immune="true"
                    data-luxury-style="${cardStyleKey}"
                    tabindex="0"
                >
                    <div class="luxury-product-visual midautumn-card-visual">
                        <div class="luxury-product-shape midautumn-card-night"></div>
                        <div class="midautumn-card-moon"><i></i></div>
                        <div class="midautumn-card-palace"></div>
                        <div class="midautumn-card-cloud cloud-a"></div>
                        <div class="midautumn-card-cloud cloud-b"></div>
                        <div class="midautumn-card-lantern lantern-a"></div>
                        <div class="midautumn-card-lantern lantern-b"></div>

                        <div class="midautumn-card-stars" aria-hidden="true">
                            <i style="--i:0"></i><i style="--i:1"></i>
                            <i style="--i:2"></i><i style="--i:3"></i>
                            <i style="--i:4"></i><i style="--i:5"></i>
                            <i style="--i:6"></i><i style="--i:7"></i>
                            <i style="--i:8"></i><i style="--i:9"></i>
                            <i style="--i:10"></i><i style="--i:11"></i>
                        </div>

                        <div class="midautumn-card-tag-shell" aria-label="Trung thu">
                            <span class="midautumn-card-tag-halo"></span>
                            <img
                                src="${tagImage}"
                                alt="Trung thu"
                                class="midautumn-card-tag-art"
                                draggable="false"
                            >
                            <span class="midautumn-card-tag-shine"></span>
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="luxury-product-image midautumn-card-character"
                            draggable="false"
                        >
                    </div>

                    <div class="luxury-product-info midautumn-card-info">
                        <span class="luxury-product-label midautumn-card-label">
                            ${cardLabel}
                        </span>

                        <h3>${name}</h3>

                        <p class="midautumn-card-intro">
                            ${cardIntro}
                        </p>

                        <div class="luxury-product-price midautumn-card-price">
                            🌕 ${midAutumnCoinPrice} Xu Trung Thu
                            <small style="display:block; margin-top:4px; opacity:.78; font-size:.78em; font-weight:700;">
                                Bạn có:
                                <span data-midautumn-coin-balance>${currentMidAutumnBalance.toLocaleString('vi-VN')}</span>
                                Xu · Không hết hạn · Đổi sẽ trừ ${midAutumnCoinPrice} Xu · Chỉ đổi đúng ngày Trung Thu
                            </small>
                        </div>

                        ${actionHTML}
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG MÙA HẠ · V2
        // Đồng bộ bố cục với card Premium đang dùng:
        // article -> visual toàn thẻ -> tag + nhân vật -> details overlay.
        // Thông tin chỉ trượt lên khi hover/focus, không chiếm nửa card.
        // ====================================================
        if (item.id === 'pet_luxury_mua_ha') {
            const tagImage = escapeHTML(
                item.luxuryTagImage ||
                'assets/Premium/Bốn mùa/ha_tag2.png'
            );

            const formattedPrice =
                Number(item.price || 12000)
                    .toLocaleString('vi-VN');

            let actionHTML = '';

            if (!isOwned) {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action"
                        onclick="window.LuxuryStore.buyItemSafely('${id}')"
                    >
                        🪙 Mua ${formattedPrice} Coin
                    </button>
                `;
            } else if (isEquipped) {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action is-equipped"
                        onclick="StoreManager.unapplyItem('${id}')"
                    >
                        ✕ Gỡ
                    </button>
                `;
            } else {
                actionHTML = `
                    <button
                        type="button"
                        class="summer-premium-card-action"
                        onclick="StoreManager.applyItem('${id}')"
                    >
                        ☀ Sử dụng
                    </button>
                `;
            }

            return `
                <article
                    class="
                        luxury-product-card
                        summer-premium-card
                        store-theme-locked
                        ui-theme-immune
                    "
                    data-item-id="${id}"
                    data-special-card="summer-premium-pet"
                    data-theme-immune="true"
                    data-luxury-style="summer"
                    tabindex="0"
                >
                    <div class="summer-premium-card__visual">
                        <div class="summer-card-sky"></div>
                        <div class="summer-card-sun-disc">
                            <i></i><i></i>
                        </div>
                        <div class="summer-card-horizon"></div>
                        <div class="summer-card-caustic"></div>
                        <div class="summer-card-glow-ribbon ribbon-a"></div>
                        <div class="summer-card-glow-ribbon ribbon-b"></div>

                        <div
                            class="summer-card-spark-field"
                            aria-hidden="true"
                        >
                            <i style="--i:0"></i>
                            <i style="--i:1"></i>
                            <i style="--i:2"></i>
                            <i style="--i:3"></i>
                            <i style="--i:4"></i>
                            <i style="--i:5"></i>
                            <i style="--i:6"></i>
                            <i style="--i:7"></i>
                            <i style="--i:8"></i>
                            <i style="--i:9"></i>
                            <i style="--i:10"></i>
                            <i style="--i:11"></i>
                        </div>

                        <div
                            class="summer-premium-card-tag-shell"
                            aria-hidden="true"
                        >
                            <span class="summer-card-tag-halo"></span>
                            <img
                                src="${tagImage}"
                                alt="Mùa hạ"
                                class="summer-premium-card-tag-art"
                                draggable="false"
                            >
                            <span class="summer-card-tag-glint"></span>
                        </div>

                        <img
                            src="${image}"
                            alt="${name}"
                            class="summer-premium-card-character"
                            draggable="false"
                        >

                        <div class="summer-premium-details">
                            <div class="summer-premium-type">
                                ☀ THÚ CƯNG PREMIUM · MÙA HẠ
                            </div>

                            <h3>${name}</h3>

                            <p class="summer-premium-description">
                                Thần vực mùa hạ kết hợp kim quang,
                                thủy ảnh, nhiệt lưu và tinh quang dịu.
                            </p>

                            <div class="summer-premium-price">
                                🪙 Giá bán: ${formattedPrice} Coin
                            </div>

                            ${actionHTML}
                        </div>
                    </div>
                </article>
            `;
        }


        // ====================================================
        // CARD RIÊNG MÙA XUÂN
        // ====================================================
        if (item.id === 'pet_luxury_mua_xuan') {

            const tagImage = escapeHTML(
                item.luxuryTagImage || ''
            );

            let actionHTML = '';

            if (!isOwned) {

                actionHTML = `
        <button
            type="button"
            class="spring-premium-use-button spring-premium-buy-button"
            onclick="
    window.LuxuryStore.buyItemSafely(
        '${id}'
    )
"
        >
            🪙 Mua 12.000 Coin
        </button>
    `;

            } else if (isEquipped) {

                actionHTML = `
        <button
            type="button"
            class="
                spring-premium-use-button
                is-equipped
            "
            onclick="
                StoreManager.unapplyItem(
                    '${id}'
                )
            "
        >
            ✕ Gỡ
        </button>
    `;

            } else {

                actionHTML = `
        <button
            type="button"
            class="spring-premium-use-button"
            onclick="
                StoreManager.applyItem(
                    '${id}'
                )
            "
        >
            🌿 Sử dụng
        </button>
    `;
            }


            return `
        <article
            class="
                luxury-product-card
                spring-premium-card
            "
            data-luxury-style="spring"
            tabindex="0"
        >

            <div class="spring-premium-card__visual">

                <!-- NỀN MÙA XUÂN -->
                <div class="spring-premium-sky"></div>
                <div class="spring-premium-card-sun"></div>
                <div class="spring-premium-card-gate"></div>
                <div class="spring-premium-card-vine vine-left"></div>
                <div class="spring-premium-card-vine vine-right"></div>

                <div class="spring-premium-card-petals" aria-hidden="true">
                    <span style="--i:0"></span>
                    <span style="--i:1"></span>
                    <span style="--i:2"></span>
                    <span style="--i:3"></span>
                    <span style="--i:4"></span>
                    <span style="--i:5"></span>
                    <span style="--i:6"></span>
                    <span style="--i:7"></span>
                </div>

                <div class="
                    spring-premium-hill
                    spring-premium-hill--back
                "></div>

                <div class="
                    spring-premium-hill
                    spring-premium-hill--front
                "></div>


                <!-- TAG -->
                ${tagImage
                    ? `
                            <div
                                class="spring-premium-tag-shell"
                                aria-hidden="true"
                            >
                                <span class="spring-premium-tag-bloom bloom-a"></span>
                                <span class="spring-premium-tag-bloom bloom-b"></span>
                                <span class="spring-premium-tag-spark spark-a"></span>
                                <span class="spring-premium-tag-spark spark-b"></span>

                                <img
                                    src="${tagImage}"
                                    alt="Mùa Xuân"
                                    class="spring-premium-tag"
                                    draggable="false"
                                >

                                <span class="spring-premium-tag-shine"></span>
                            </div>
                        `
                    : ''
                }


                <!-- NHÂN VẬT -->
                <img
                    src="${image}"
                    alt="${name}"
                    class="spring-premium-character"
                    draggable="false"
                >


                <!--
                    THÔNG TIN:
                    Bình thường ẩn hoàn toàn.
                    Hover/touch mới trượt lên.
                -->
                <div
                    class="spring-premium-details"
                >

                    <div class="spring-premium-type">
                        🐾 THÚ CƯNG PREMIUM
                    </div>

                    <h3>
                        ${name}
                    </h3>

                    <p class="spring-premium-description">
                        Vương Miện Xuân Thần mở đồng thời
                        thần vực, giao diện và thú cưng.
                    </p>

                    <div class="spring-premium-source">
    🪙 Giá bán: 12.000 Coin
</div>

                    ${actionHTML}

                </div>

            </div>

        </article>
    `;
        }


        // ====================================================
        // CARD PREMIUM THƯỜNG
        // ====================================================

        const price =
            Number(item.price) || 0;

        return `
        <article
            class="luxury-product-card"
        >

            <div
                class="luxury-product-visual"
            >

                <div
                    class="luxury-product-shape"
                ></div>

                ${image
                ? `
                            <img
                                src="${image}"
                                alt="${name}"
                                class="
                                    luxury-product-image
                                "
                            >
                        `
                : `
                            <div
                                class="
                                    luxury-product-placeholder
                                "
                            >
                                💎
                            </div>
                        `
            }

            </div>

            <div
                class="luxury-product-info"
            >

                <span
                    class="luxury-product-label"
                >
                    LUXURY
                </span>

                <h3>${name}</h3>

                <div
                    class="luxury-product-price"
                >
                    ${price > 0
                ? `🪙 ${price} Coin`
                : 'Vật phẩm đặc biệt'
            }
                </div>

            </div>

        </article>
    `;
    }


    // ========================================================
    // 5. RENDER DANH SÁCH
    // ========================================================
    function renderLuxuryStore() {

        const grid =
            document.getElementById(
                IDS.grid
            );

        if (!grid) return;

        const items =
            getLuxuryItems();

        if (!items.length) {

            grid.innerHTML = `
                <div class="luxury-store-empty">

                    <div class="luxury-store-empty-icon">
                        💎
                    </div>

                    <strong>
                        Chưa có vật phẩm sang trọng
                    </strong>

                </div>
            `;

            return;
        }


        grid.innerHTML =
            items
                .map(item => {
                    const html = renderCard(item);
                    return window.ListMediaPerformance?.prepareHTML(html) ?? html;
                })
                .join('');

        // A trial is not permanent ownership. Offer the existing upgrade flow.
        grid.querySelectorAll('[data-item-id]').forEach(card => {
            const id = card.dataset.itemId;
            const inventory = getLuxuryInventoryItem(id);
            const item = items.find(candidate => String(candidate.id) === id);
            if (!item || item.isLocked || item.eventOnly || item.isNonCoin ||
                inventory?.isTrial !== true || Number(inventory.trialExpiry || 0) <= Date.now()) return;
            const upgrade = document.createElement('button');
            upgrade.type = 'button';
            upgrade.className = 'btn-approve luxury-trial-upgrade';
            upgrade.textContent = 'Nâng cấp vĩnh viễn';
            upgrade.addEventListener('click', async () => {
                upgrade.disabled = true;
                try { await buyLuxuryItemSafely(id); }
                catch (error) { console.error('[LuxuryStore] Upgrade failed:', error); }
                finally { upgrade.disabled = false; }
            });
            (card.querySelector('.luxury-unified-actions') || card).appendChild(upgrade);
        });

        /*
         * HOTFIX v4.0.1:
         * renderCard() đã tạo placeholder riêng cho vật phẩm bị khóa.
         * Không gắn thêm overlay lần hai để tránh hai dấu ? chồng nhau.
         */

        // Khóa thao tác copy/lưu cho toàn bộ ảnh của Cửa hàng Sang trọng.
        window.StoreImageProtection?.protectSubtree(grid);
    }


    // ========================================================
    // 6. ĐÓNG TRANG SƯU TẦM NẾU ĐANG MỞ
    // ========================================================
    function closeCollectionPage() {

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const collectionPage =
            document.getElementById(
                'storeCollectionPage'
            );

        /*
         * Đóng popup "cách nhận" của Sưu tầm trước.
         * Nếu API chưa tồn tại thì vẫn có DOM fallback bên dưới.
         */
        try {
            if (
                window.StoreCollectionPage &&
                typeof window
                    .StoreCollectionPage
                    .closeAcquisitionWays ===
                    'function'
            ) {
                window
                    .StoreCollectionPage
                    .closeAcquisitionWays();
            }
        } catch (_) {}

        /*
         * Gọi API chuẩn nếu có.
         */
        try {
            if (
                window.StoreCollectionPage &&
                typeof window
                    .StoreCollectionPage
                    .close === 'function'
            ) {
                window
                    .StoreCollectionPage
                    .close();
            }
        } catch (_) {}

        /*
         * DOM fallback bắt buộc:
         * không phụ thuộc animation/timer của store-collections.js.
         * Mở Luxury là Sưu tầm phải biến mất ngay trong cùng frame.
         */
        storeTab?.classList.remove(
            'store-collection-view-active'
        );

        if (
            storeTab?.dataset.storeView ===
            'collection'
        ) {
            storeTab.dataset.storeView =
                'normal';
        }

        if (collectionPage) {
            collectionPage.classList.remove(
                'is-visible'
            );

            collectionPage.hidden = true;
            collectionPage.inert = true;

            collectionPage.setAttribute(
                'inert',
                ''
            );

            collectionPage.setAttribute(
                'aria-hidden',
                'true'
            );
        }

        const acquisitionModal =
            document.getElementById(
                'storeCollectionAcquisitionModal'
            );

        if (acquisitionModal) {
            acquisitionModal.classList.remove(
                'is-open'
            );

            acquisitionModal.hidden = true;
            acquisitionModal.inert = true;

            acquisitionModal.setAttribute(
                'inert',
                ''
            );

            acquisitionModal.setAttribute(
                'aria-hidden',
                'true'
            );
        }

        document.body?.classList.remove(
            'store-collection-acquisition-open'
        );

        /*
         * Vì click Luxury sẽ stopPropagation(), handler dropdown của
         * Sưu tầm không còn cơ hội tự đóng menu. Ta đóng nó tại đây.
         */
        const collectionArrow =
            document.getElementById(
                'storeCollectionArrow'
            );

        const collectionDropdown =
            document.getElementById(
                'storeCollectionDropdown'
            );

        collectionArrow?.classList.remove(
            'is-open'
        );

        collectionArrow?.setAttribute(
            'aria-expanded',
            'false'
        );

        collectionDropdown?.classList.remove(
            'is-open'
        );

        collectionDropdown?.setAttribute(
            'aria-hidden',
            'true'
        );
    }


    // ========================================================
    // 7. CÔ LẬP VIEW CỬA HÀNG SANG TRỌNG
    // ========================================================
    // Không chỉ dựa vào inline style. student.js/Firebase/lazy-loader có thể
    // đồng bộ quyền truy cập sau đó và ghi lại display:block cho storeActiveView.
    // Class này là "nguồn sự thật" cho view đang mở và CSS !important đảm bảo
    // Cửa hàng thường không thể ló ra phía trên Cửa hàng Sang trọng.
    let luxuryStoreCloseTimer = null;

    function ensureLuxuryStoreViewIsolationStyles() {

        if (
            document.getElementById(
                'luxuryStoreViewIsolationStyles'
            )
        ) {
            return;
        }

        const style =
            document.createElement('style');

        style.id =
            'luxuryStoreViewIsolationStyles';

        style.textContent = `
            /*
             * STRICT STORE VIEW ISOLATION v2
             * Normal / Sưu tầm / Luxury là 3 view loại trừ nhau.
             */

            #tab-store.luxury-store-view-active > #storeActiveView,
            #tab-store.luxury-store-view-active > #storeLockedView,
            #tab-store.luxury-store-view-active > #storeCollectionPage {
                display: none !important;
            }

            #tab-store.luxury-store-view-active > #luxuryStorePage[hidden] {
                display: none !important;
            }

            #tab-store.luxury-store-view-active > #luxuryStorePage:not([hidden]) {
                display: block !important;
            }

            /*
             * Chiều ngược lại: khi Sưu tầm đang mở, Luxury tuyệt đối không
             * được xuất hiện dù timer/fade cũ hoặc module lazy-load vừa chạy.
             */
            #tab-store.store-collection-view-active > #luxuryStorePage {
                display: none !important;
            }
        `;

        (document.head || document.documentElement)
            .appendChild(style);
    }


    function setLuxuryStoreViewActive(active) {

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (!storeTab) return;

        const isActive =
            Boolean(active);

        storeTab.classList.toggle(
            'luxury-store-view-active',
            isActive
        );

        if (isActive) {
            /*
             * Một tab chỉ được có đúng một view đặc biệt.
             */
            storeTab.classList.remove(
                'store-collection-view-active'
            );

            storeTab.dataset.storeView =
                'luxury';
        } else if (
            storeTab.dataset.storeView ===
            'luxury'
        ) {
            storeTab.dataset.storeView =
                'normal';
        }
    }


    function isLuxuryStoreOpen() {

        const page =
            document.getElementById(
                IDS.page
            );

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        return Boolean(
            page &&
            page.hidden === false &&
            (
                storeTab?.classList.contains(
                    'luxury-store-view-active'
                ) ||
                page.classList.contains(
                    'is-visible'
                )
            )
        );
    }


    // ========================================================
    // 8. ẨN CỬA HÀNG THƯỜNG
    // ========================================================
    function hideNormalStore() {

        const activeView =
            document.getElementById(
                'storeActiveView'
            );

        const lockedView =
            document.getElementById(
                'storeLockedView'
            );

        if (activeView) {
            activeView.style.display =
                'none';
        }

        if (lockedView) {
            lockedView.style.display =
                'none';
        }
    }


    // ========================================================
    // 9. KHÔI PHỤC CỬA HÀNG THƯỜNG
    // ========================================================
    function restoreNormalStore() {

        const activeView =
            document.getElementById(
                'storeActiveView'
            );

        const lockedView =
            document.getElementById(
                'storeLockedView'
            );

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const collectionOpen =
            Boolean(
                storeTab?.classList.contains(
                    'store-collection-view-active'
                )
            );

        let storeOpen = true;

        try {
            if (
                typeof window
                    .isStudentStoreSystemOpen ===
                'function'
            ) {
                storeOpen =
                    window
                        .isStudentStoreSystemOpen();
            } else {
                storeOpen = !(
                    window.storeLocked === true ||
                    window.isStoreLocked === true
                );
            }
        } catch (_) {
            storeOpen = !(
                window.storeLocked === true ||
                window.isStoreLocked === true
            );
        }

        if (lockedView) {
            lockedView.style.display =
                storeOpen
                    ? 'none'
                    : 'block';
        }

        if (activeView) {
            activeView.style.display =
                (
                    storeOpen &&
                    !collectionOpen
                )
                    ? 'block'
                    : 'none';
        }
    }


    // ========================================================
    // 10. MỞ CỬA HÀNG SANG TRỌNG
    // ========================================================
    function openLuxuryStore() {

        ensureLuxuryStoreViewIsolationStyles();

        if (luxuryStoreCloseTimer) {
            window.clearTimeout(
                luxuryStoreCloseTimer
            );

            luxuryStoreCloseTimer = null;
        }

        closeCollectionPage();

        const page =
            document.getElementById(
                IDS.page
            );

        if (!page) return;

        /*
         * Đánh dấu view trước khi hiện page để không có một frame nào
         * Cửa hàng thường và Cửa hàng Sang trọng cùng xuất hiện.
         */
        setLuxuryStoreViewActive(true);
        hideNormalStore();

        page.hidden = false;
        page.inert = false;
        page.removeAttribute('inert');
        page.setAttribute(
            'aria-hidden',
            'false'
        );

        requestAnimationFrame(() => {
            /*
             * Nếu close() được gọi ngay trước frame này thì không bật lại.
             */
            if (
                page.hidden === false &&
                document
                    .getElementById('tab-store')
                    ?.classList.contains(
                        'luxury-store-view-active'
                    )
            ) {
                page.classList.add(
                    'is-visible'
                );
            }
        });

        const heading =
            document.querySelector(
                '#tab-store .store-collection-title-row h2'
            ) ||
            document.querySelector(
                '#tab-store > h2'
            );

        if (heading) {
            heading.textContent =
                'Cửa hàng Sang trọng';
        }

        renderLuxuryStore();
    }


    // ========================================================
    // 11. ĐÓNG CỬA HÀNG SANG TRỌNG
    // ========================================================
    function closeLuxuryStore(options = {}) {

        const immediate =
            options === true ||
            options?.immediate === true;

        const restoreNormal =
            options === true ||
            options?.restoreNormal !== false;

        const resetHeading =
            options === true ||
            options?.resetHeading !== false;

        const page =
            document.getElementById(
                IDS.page
            );

        const finishClose = () => {

            if (
                page &&
                page.classList.contains(
                    'is-visible'
                )
            ) {
                /*
                 * Trang đã được mở lại trong lúc timer close cũ đang chờ.
                 * Không được ẩn page mới.
                 */
                return;
            }

            if (page) {
                page.hidden = true;
                page.inert = true;
                page.setAttribute(
                    'inert',
                    ''
                );
                page.setAttribute(
                    'aria-hidden',
                    'true'
                );
            }

            setLuxuryStoreViewActive(false);

            const heading =
                document.querySelector(
                    '#tab-store .store-collection-title-row h2'
                ) ||
                document.querySelector(
                    '#tab-store > h2'
                );

            if (
                resetHeading &&
                heading
            ) {
                heading.textContent =
                    'Cửa hàng Vật phẩm';
            }

            if (restoreNormal) {
                restoreNormalStore();
            }
        };

        if (luxuryStoreCloseTimer) {
            window.clearTimeout(
                luxuryStoreCloseTimer
            );

            luxuryStoreCloseTimer = null;
        }

        if (!page) {
            finishClose();
            return;
        }

        page.classList.remove(
            'is-visible'
        );

        page.setAttribute(
            'aria-hidden',
            'true'
        );

        /*
         * Trong 200 ms fade-out, class luxury-store-view-active vẫn được giữ.
         * Vì vậy storeActiveView KHÔNG được hiện sớm và không còn cảnh 2 cửa hàng
         * chồng/lẫn vào nhau.
         */
        if (immediate) {
            finishClose();
            return;
        }

        luxuryStoreCloseTimer =
            window.setTimeout(
                () => {
                    luxuryStoreCloseTimer =
                        null;

                    finishClose();
                },
                200
            );
    }


    // ========================================================
    // 11B. MUTUAL EXCLUSION · SƯU TẦM ↔ LUXURY
    // ========================================================
    let collectionLuxuryBridgeTimer = null;
    let collectionLuxuryViewObserver = null;
    let collectionLuxuryBridgeInstalled = false;
    let collectionLuxuryClickBridgeTarget = null;
    let collectionLuxuryClickBridgeHandler = null;

    function closeLuxuryForCollection() {
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        const page =
            document.getElementById(
                IDS.page
            );

        const luxuryLooksActive =
            Boolean(
                storeTab?.classList.contains(
                    'luxury-store-view-active'
                ) ||
                (
                    page &&
                    (
                        page.hidden === false ||
                        page.classList.contains(
                            'is-visible'
                        )
                    )
                )
            );

        if (!luxuryLooksActive) {
            return;
        }

        /*
         * Chuyển thẳng sang Sưu tầm:
         * - đóng Luxury ngay;
         * - không bật store normal ở giữa;
         * - không reset heading vì Collection sẽ tự đặt tiêu đề của nó.
         */
        closeLuxuryStore({
            immediate: true,
            restoreNormal: false,
            resetHeading: false
        });
    }

    function installCollectionLuxuryMutualExclusionBridge(
        attempt = 0
    ) {
        const api =
            window.StoreCollectionPage;

        if (
            !api ||
            typeof api.open !==
                'function'
        ) {
            if (attempt < 120) {
                window.setTimeout(
                    () =>
                        installCollectionLuxuryMutualExclusionBridge(
                            attempt + 1
                        ),
                    100
                );
            }

            return false;
        }

        if (collectionLuxuryBridgeInstalled) {
            return true;
        }

        /*
         * StoreCollectionPage được store-collections.js export bằng
         * Object.freeze(...), vì vậy KHÔNG được gán lại api.open hoặc
         * thêm cờ trực tiếp lên object API. Việc ghi đè sẽ ném:
         * "Cannot assign to read only property 'open'" trong strict mode.
         *
         * Thay vào đó:
         * 1) bắt click mở Sưu tầm ở capture phase để đóng Luxury trước;
         * 2) MutationObserver bên dưới vẫn xử lý mọi lần open() bằng code.
         */
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (storeTab) {
            collectionLuxuryClickBridgeTarget =
                storeTab;

            collectionLuxuryClickBridgeHandler =
                event => {
                    const target =
                        event.target instanceof Element
                            ? event.target.closest(
                                '#storeCollectionOpenButton'
                            )
                            : null;

                    if (!target) {
                        return;
                    }

                    closeLuxuryForCollection();
                };

            storeTab.addEventListener(
                'click',
                collectionLuxuryClickBridgeHandler,
                true
            );
        }

        collectionLuxuryBridgeInstalled = true;

        return true;
    }

    function installCollectionLuxuryViewObserver() {
        const storeTab =
            document.getElementById(
                'tab-store'
            );

        if (
            !storeTab ||
            collectionLuxuryViewObserver
        ) {
            return;
        }

        collectionLuxuryViewObserver =
            new MutationObserver(() => {
                if (
                    storeTab.classList.contains(
                        'store-collection-view-active'
                    )
                ) {
                    closeLuxuryForCollection();
                }

                /*
                 * Nếu Luxury đang active thì Collection page không được
                 * tự bật lại bởi timer cũ.
                 */
                if (
                    storeTab.classList.contains(
                        'luxury-store-view-active'
                    )
                ) {
                    const collectionPage =
                        document.getElementById(
                            'storeCollectionPage'
                        );

                    if (
                        collectionPage &&
                        (
                            collectionPage.hidden === false ||
                            collectionPage.classList.contains(
                                'is-visible'
                            )
                        )
                    ) {
                        closeCollectionPage();
                    }
                }
            });

        collectionLuxuryViewObserver.observe(
            storeTab,
            {
                attributes: true,
                attributeFilter: [
                    'class',
                    'data-store-view'
                ],
                childList: true,
                subtree: true
            }
        );
    }


    // ========================================================
    // 12. TẠO GIAO DIỆN
    // ========================================================
    function buildLuxuryStoreUI(
        attempt = 0
    ) {

        /*
         * Trang giáo viên vẫn nạp module này để dùng dữ liệu/quản lý Luxury,
         * nhưng không có #tab-store. Không chạy vòng retry dựng UI học sinh.
         */
        if (
            document.documentElement?.dataset?.appRole ===
            'teacher'
        ) {
            return;
        }

        const storeTab =
            document.getElementById(
                'tab-store'
            );

        /*
         * Menu này do store-collections.js
         * tạo ra sau khi trang được tải.
         */
        const dropdownClip =
            document.querySelector(
                '#storeCollectionDropdown ' +
                '.store-collection-dropdown__clip'
            );


        if (
            !storeTab ||
            !dropdownClip
        ) {

            if (attempt < 100) {

                setTimeout(
                    () =>
                        buildLuxuryStoreUI(
                            attempt + 1
                        ),
                    100
                );

            }

            return;
        }


        // Tránh tạo trùng
        if (
            document.getElementById(
                IDS.button
            )
        ) {
            return;
        }


        // ====================================================
        // NÚT CỬA HÀNG SANG TRỌNG
        // ====================================================

        const button =
            document.createElement(
                'button'
            );

        button.type = 'button';

        button.id =
            IDS.button;

        /*
         * Dùng chính class của nút Sưu tầm
         * => giao diện sẽ giống hệt.
         */
        button.className =
            'store-collection-dropdown__item ' +
            'luxury-store-menu-item';

        button.innerHTML = `
            <span
                class="store-collection-dropdown__item-icon"
                aria-hidden="true"
            >
                💎
            </span>

            <span>
                <strong>
                    Cửa hàng sang trọng
                </strong>

                <small>
                    Khám phá các vật phẩm cao cấp
                </small>
            </span>

            <span
                class="store-collection-dropdown__go"
                aria-hidden="true"
            >
                →
            </span>
        `;


        dropdownClip.appendChild(
            button
        );


        // ====================================================
        // TRANG CỬA HÀNG SANG TRỌNG
        // ====================================================

        const page =
            document.createElement(
                'section'
            );

        page.id =
            IDS.page;

        page.className =
            'luxury-store-page';

        page.hidden = true;

        page.innerHTML = `

            <div class="luxury-store-toolbar">

                <div>
                    <span class="luxury-store-kicker">
                        PREMIUM COLLECTION
                    </span>

                    <h3>
                        Bộ sưu tập sang trọng
                    </h3>

                    <p>
                        Các vật phẩm cao cấp
                        được tuyển chọn riêng.
                    </p>
                </div>

                <button
                    type="button"
                    id="luxuryStoreBackButton"
                    class="luxury-store-back"
                >
                    ← Cửa hàng
                </button>

            </div>


            <div
                id="${IDS.grid}"
                class="luxury-store-grid"
            ></div>
        `;


        /*
         * Chèn trang mới vào bên trong tab Cửa hàng.
         */
        storeTab.appendChild(
            page
        );


        window.StoreImageProtection?.protectSubtree(page);


        // CLICK MỞ
        button.addEventListener(
            'click',
            event => {
                /*
                 * QUAN TRỌNG:
                 * button dùng cùng class visual với item Sưu tầm.
                 * Chặn bubbling để click này không lọt vào event delegation
                 * của #storeCollectionDropdown và mở Sưu tầm cùng lúc.
                 */
                event.preventDefault();
                event.stopPropagation();

                openLuxuryStore();
            }
        );


        // CLICK QUAY LẠI
        document
            .getElementById(
                'luxuryStoreBackButton'
            )
            ?.addEventListener(
                'click',
                () => {
                    closeLuxuryStore();
                }
            );

        /*
         * store-collections.js đã tạo dropdown/page trước khi buildLuxuryStoreUI
         * thành công, nên đây là thời điểm tốt nhất để khóa 2 view với nhau.
         */
        installCollectionLuxuryMutualExclusionBridge();
        installCollectionLuxuryViewObserver();
    }


    // ========================================================
    // EQUIPPED LUXURY REHYDRATE BRIDGE
    // ========================================================
    // luxury-store.js có thể được lazy-load SAU khi Firebase inventory đã về.
    // Khi đó applyEquippedItems() trước đó không biết các item Luxury vì chúng
    // chưa được đăng ký vào StoreConfig. Bridge này cho phép tự áp lại ngay sau
    // khi module Luxury vừa boot, không cần người dùng bấm tab Cửa hàng.
    let luxuryRehydrateTimer = null;
    let luxuryRehydratePromise = null;

    function getEquippedLuxuryInventoryItem() {
        if (window.isStudentStoreGameAccessEnabled?.() === false) return null;
        const inventory =
            Array.isArray(window.myInventory)
                ? window.myInventory
                : [];

        return inventory.find(invItem =>
            invItem &&
            invItem.isEquipped === true &&
            LUXURY_ITEM_IDS.includes(
                String(invItem.id || '')
            )
        ) || null;
    }

    async function rehydrateEquippedLuxuryRuntime(
        reason = 'manual'
    ) {
        const equipped =
            getEquippedLuxuryInventoryItem();

        if (!equipped) {
            return false;
        }

        if (
            typeof window.applyEquippedItems !==
            'function'
        ) {
            return false;
        }

        if (luxuryRehydratePromise) {
            return luxuryRehydratePromise;
        }

        luxuryRehydratePromise =
            (async () => {
                await Promise.resolve(
                    window.applyEquippedItems()
                );

                console.debug(
                    '[LuxuryStore] Rehydrated equipped item:',
                    equipped.id,
                    reason
                );

                return true;
            })();

        try {
            return await luxuryRehydratePromise;
        } finally {
            luxuryRehydratePromise = null;
        }
    }

    function scheduleEquippedLuxuryRehydrate(
        reason = 'boot',
        delay = 80
    ) {
        if (luxuryRehydrateTimer) {
            clearTimeout(luxuryRehydrateTimer);
        }

        luxuryRehydrateTimer =
            window.setTimeout(
                () => {
                    luxuryRehydrateTimer = null;

                    rehydrateEquippedLuxuryRuntime(
                        reason
                    ).catch(error => {
                        console.warn(
                            '[LuxuryStore] Không thể tự khôi phục Luxury runtime:',
                            error
                        );
                    });
                },
                Math.max(
                    0,
                    Number(delay) || 0
                )
            );
    }


    // ========================================================
    // API
    // ========================================================
    window.LuxuryStore = {
        clearEquippedRuntime: hardClearBoundaryPetRuntime,
        ensureUI: buildLuxuryStoreUI,
        open: openLuxuryStore,
        close: closeLuxuryStore,
        isOpen: isLuxuryStoreOpen,
        refresh: renderLuxuryStore,
        buyItemSafely:
            itemId =>
                buyLuxuryItemSafely(itemId),
        rehydrateEquipped:
            reason =>
                rehydrateEquippedLuxuryRuntime(
                    reason || 'api'
                ),

        getItems:
            () => getLuxuryItems(),

        // Kiểm tra vật phẩm có thuộc Cửa hàng Sang trọng hay không
        isLuxuryItem: itemOrId => {
            const itemId =
                typeof itemOrId === 'object'
                    ? itemOrId?.id
                    : itemOrId;

            return LUXURY_ITEM_IDS.includes(
                String(itemId ?? '')
            );
        },

        // Lệnh test nhanh trong Console — kích hoạt đủ 3 lớp.
        applySpring: () => {

            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {

                PetManager.spawnPet(
                    SPRING_PREMIUM_PET
                );
            }
        },

        // Test nhanh Mùa Hạ — FULL SUITE độc lập.
        previewSummer: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    SUMMER_PREMIUM_PET
                );
            }
        },

        // Khôi phục runtime Mùa Hạ sau reload / khi pet đã spawn trước LuxuryStore.
        restoreSummer: () => {
            LuxuryHacMongRuntime.restore();
            LuxuryAutumnRuntime.restore();
        LuxurySummerRuntime.restore();
        },

        // Test riêng ultimate toàn màn hình mà không cần click pet.
        summerUltimateTest: () => {
            const pet = LuxurySummerRuntime.getPet();
            if (!pet) return false;

            const rect = pet.getBoundingClientRect();
            LuxurySummerRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
            return true;
        },

        // Test nhanh Lord of the Mysteries · Klein — không cấp quyền sở hữu.
        previewLotmKlein: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    LOTM_KLEIN_EVENT_PET
                );
            }
        },

        clearLotmKlein: () => {
            LuxuryLotmKleinRuntime.clear();
        },

        // Khôi phục toàn bộ full-web suite Klein sau reload/lazy-load.
        restoreLotmKlein: () => {
            return LuxuryLotmKleinRuntime.restore();
        },

        // Test riêng ultimate toàn màn hình.
        lotmKleinUltimateTest: () => {
            const pet =
                LuxuryLotmKleinRuntime.getPet() ||
                document.querySelector('#virtual-pet-container #virtual-pet-img');

            if (!pet) return false;

            const rect = pet.getBoundingClientRect();
            return LuxuryLotmKleinRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
        },

        // Test nhanh Cầm Cơ · Cầm Mộng — FULL SUITE V1.
        previewCamCoCamMong: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    CAM_CO_CAM_MONG_PET
                );
            }
        },

        // Test nhanh Tamon's B-Side — kích hoạt FULL SUITE V1.
        previewTamonBSide: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    TAMON_BSIDE_PET
                );
            }
        },

        // Test nhanh Tamon · Hắc Phấn Nghịch Nhịp — FULL SUITE mới.
        previewTamonPinkStatic: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    TAMON_PINKSTATIC_PET
                );
            }
        },

        // Test nhanh Đêm đầy sao — FULL SUITE V1.
        previewStarryNight: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    STARRY_NIGHT_PREMIUM_PET
                );
            }
        },

        restoreStarryNight: () => {
            return LuxuryStarryNightRuntime.restore();
        },

        starryNightUltimateTest: () => {
            const pet = LuxuryStarryNightRuntime.getPet();
            if (!pet) return false;
            const rect = pet.getBoundingClientRect();
            return LuxuryStarryNightRuntime.createUltimate(
                rect.left + rect.width / 2,
                rect.top + rect.height / 2
            );
        },

        clearStarryNight: () => {
            LuxuryStarryNightRuntime.clear();
        },

        // Test nhanh Nyx Thần thoại — kích hoạt FULL SUITE V2.
        previewNyx: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MYTHIC_NYX_PET
                );
            }
        },


        // Test nhanh Aether Thần thoại — FULL SUITE V1.
        previewAether: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MYTHIC_AETHER_PET
                );
            }
        },

        // Test nhanh thú cưng Quốc khánh (không cấp quyền sở hữu).
        previewNationalDay: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    NATIONAL_DAY_PREMIUM_PET
                );
            }
        },

        clearSummer: () => {
            LuxurySummerRuntime.clear();
        },

        clearNyx: () => {
            LuxuryNyxRuntime.clear();
        },


        clearAether: () => {
            LuxuryAetherRuntime.clear();
        },

        clearCamCoCamMong: () => {
            LuxuryCamCoCamMongRuntime.clear();
        },

        clearTamonBSide: () => {
            LuxuryTamonBSideRuntime.clear();
        },

        clearTamonPinkStatic: () => {
            LuxuryTamonPinkStaticRuntime.clear();
        },

        previewLinkClickCheng: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    LINKCLICK_CHENG_XIAOSHI_PET
                );
            }
        },

        clearLinkClickCheng: () => {
            LuxuryLinkClickChengRuntime.clear();
        },

        // Chẩn đoán/sửa nhanh full-web Link Click theo pet đang hiển thị.
        repairLinkClickCheng: () => {
            ensureLinkClickChengStylesheet();
            return syncLinkClickChengRuntimeFromDom();
        },

        previewMidAutumn: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MID_AUTUMN_MOON_PET
                );
            }
        },

        previewMidAutumnCuoi: () => {
            if (
                typeof PetManager !== 'undefined' &&
                typeof PetManager.spawnPet === 'function'
            ) {
                PetManager.spawnPet(
                    MID_AUTUMN_CUOI_PET
                );
            }
        },

        clearMidAutumn: () => {
            LuxuryMidAutumnRuntime.clear();
        },

        clearSpring: () => {

            LuxurySpringRuntime.clear();

            if (
                typeof PetManager !== 'undefined'
            ) {
                PetManager.container =
                    document.getElementById(
                        'virtual-pet-container'
                    );
            }
        },
    };


    // ========================================================
    // KHỞI ĐỘNG
    // ========================================================
    [LuxuryHacMongRuntime, LuxuryAutumnRuntime, LuxurySpringRuntime, LuxurySummerRuntime, LuxuryNationalDayRuntime,
        LuxuryNyxRuntime, LuxuryAetherRuntime, LuxuryTamonBSideRuntime,
        LuxuryTamonPinkStaticRuntime, LuxuryLotmKleinRuntime, LuxuryCamCoCamMongRuntime,
        LuxuryMidAutumnRuntime, LuxuryLinkClickChengRuntime,
        LuxuryStarryNightRuntime].forEach(runtime => {
        ['mount', 'restore', 'repair', 'createUltimate'].forEach(method => {
            const original = runtime[method];
            if (typeof original !== 'function') return;
            runtime[method] = function (...args) {
                if (window.isStudentStoreGameAccessEnabled?.() === false) return false;
                return original.apply(this, args);
            };
        });
    });

    function bootLuxuryStore() {

        // Mount navigation before optional pet/effect recovery can fail.
        buildLuxuryStoreUI();

        ensureLuxuryStoreViewIsolationStyles();
        ensureAutumnStylesheet();
        ensureHacMongStylesheet();
        ensureLotmKleinStylesheet();
        ensureCamCoCamMongStylesheet();
        ensureTamonBSideStylesheet();
        ensureMidAutumnStylesheet();
        ensureLinkClickChengStylesheet();
        ensureStarryNightStylesheet();

        installLuxurySpringPetHook();
        installLinkClickChengAutoMountObserver();

        // Rehydrate Summer V2 even when active_pet was restored before
        // luxury-store.js finished installing its spawn hook.
        LuxurySummerRuntime.restore();
        LuxuryMidAutumnRuntime.restore();
        LuxuryLinkClickChengRuntime.restore();
        LuxuryStarryNightRuntime.restore();

        // Tự sửa thêm một nhịp sau khi DOM/pet đã ổn định.
        window.setTimeout(
            syncLinkClickChengRuntimeFromDom,
            320
        );

        installLuxurySpringUnapplyHook();

        // Khóa trang bị chéo giữa 2 cửa hàng
        installStoreBoundaryEquipGuard();

        buildLuxuryStoreUI();

        installCollectionLuxuryMutualExclusionBridge();
        installCollectionLuxuryViewObserver();

        installLuxuryInventoryListener();

        /*
         * Quan trọng cho lazy-load:
         * inventory có thể đã được đọc trước khi luxury-store.js tồn tại.
         * Sau khi đăng ký item + hook xong, tự áp lại pet Luxury đang mặc.
         */
        scheduleEquippedLuxuryRehydrate(
            'luxury-module-boot',
            90
        );
    }

    if (
        document.readyState ===
        'loading'
    ) {

        document.addEventListener(
            'DOMContentLoaded',
            bootLuxuryStore,
            { once: true }
        );

    } else {

        bootLuxuryStore();

    }

})();
