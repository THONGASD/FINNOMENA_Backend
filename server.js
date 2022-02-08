const axios = require("axios");
const express = require("express");
const app = express();
const cors = require("cors");
const moment = require("moment");
app.use(
  cors({
    origin: "*",
  })
);
const Header = {
  "Cache-Control": "no-cache",
  "Ocp-Apim-Subscription-Key": "15891198c0be44b082b36ea4e7384526",
};
app.get("/:date", (req, res) => {
  const dateRange = req.params.date;
  axios(
    `https://storage.googleapis.com/finno-ex-re-v2-static-staging/recruitment-test/fund-ranking-${dateRange}.json`
  ).then((response) => {
    return res.send(response.data);
  });
});
app.get("/fund/detail/:name", async (req, res) => {
  try {
    var dataObj = {};
    const fund_name = req.params.name;
    const dailyFund = await axios.post(
      `https://api.sec.or.th/FundFactsheet/fund`,
      {
        name: fund_name,
      },
      {
        headers: Header,
      }
    );
    dataObj.daily = dailyFund.data
      ? dailyFund.data.find((el) => el.proj_abbr_name == fund_name)
      : [];
    let proj_id = dataObj.daily.proj_id;
    dataObj.assets = await getInvestMentAsset(proj_id);
    dataObj.risk = await getRiskOfFund(proj_id);
    dataObj.risk_assessment = await getSuggestRisk(proj_id);
    dataObj.daily.feeder_fund = await getFeederFund(proj_id);
    dataObj.related = await getFundRelated(proj_id);
    dataObj.daily.policy = await getPolicy(proj_id);
    return res.send({ status: true, data: dataObj });
  } catch (error) {
    console.log(error.message);
    return res.status(200).json({ status: false, error_msg: error.message });
  }
});
const getInvestMentAsset = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/asset`,
    {
      headers: Header,
    }
  );
  let dataObj = { data: [], labels: [] };
  for (const items of data.data) {
    dataObj.labels.push(items.asset_name);
    if (items.asset_ratio > 0) {
      dataObj.data.push(items.asset_ratio);
    }
  }
  return dataObj;
};
const getFeederFund = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/feeder_fund`,
    {
      headers: Header,
    }
  );

  return data.data;
};
const getFundRelated = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/InvolveParty`,
    {
      headers: Header,
    }
  );
  let entity_type = {
    A: "ผู้สอบบัญชี",
    U: "ผู้จัดจำหน่าย",
    S: "ผู้สนับสนุนการขายและรับซื้อคืน",
    R: "นายทะเบียนหน่วยลงทุน",
    V: "ผู้ดูแลผลประโยชน์",
    M: "ที่ปรึกษาการลงทุน",
    O: "ผู้รับมอบหมายงานด้านการจัดการลงทุน",
    P: "ผู้ลงทุนรายใหญ่",
    K: "ผู้ดูแลสภาพคล่อง",
    N: "ที่ปรึกษาทางการเงิน",
    F: "ผู้จัดการกองทุน",
  };
  for (const items of data.data) {
    items.entity_type = entity_type[items.entity_type];
  }
  return data.data;
};
const getPolicy = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/policy`,
    {
      headers: Header,
    }
  );

  return data.data;
};
const getSuggestRisk = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/suitability`,
    {
      headers: Header,
    }
  );

  data.data.important_notice = decodeBase64(data.data.important_notice);
  data.data.fund_not_suitable_desc = decodeBase64(
    data.data.fund_not_suitable_desc
  );
  data.data.fund_suitable_desc = decodeBase64(data.data.fund_suitable_desc);
  data.data.risk_spectrum_desc = decodeBase64(data.data.risk_spectrum_desc);

  //   console.log();
  return data.data;
};
const getRiskOfFund = async (proj_id) => {
  const data = await axios(
    `https://api.sec.or.th/FundFactsheet/fund/${proj_id}/risk`,
    {
      headers: Header,
    }
  );
  return data.data;
};
const decodeBase64 = (string) => {
  var buff = "";
  // Node 5.10+
  buff = Buffer.from(string, "base64"); // Ta-da
  const str = buff.toString("utf-8");

  return str;
};
app.listen(3000, () => {
  console.log("Start server at port 3000.");
});
