import { LayoutDashboard } from "lucide-react"
import Title from "../../../components/common/Title"
import KeyMetric from "../components/KeyMetric"
import ChartCard from "../components/ChartCard"
import { useState } from "react"
import { currentMonth, getDashboardDataByMonth, getOrderStatusByMonth } from "@/utils/dashboard"
import OfflineOrders from "../components/OfflineOrders"
import OnlineOrders from "../components/OnlineOrders"
import RevenueChart from "../components/RevenueChart"
import StatsCard from "../components/StatsCard"


const DashBoard = () => {
  const [chartMonth, setChartMonth] = useState(currentMonth);
  const [onlineMonth, setOnlineMonth] = useState(currentMonth);
  const [offlineMonth, setOfflineMonth] = useState(currentMonth);

  const { 
    orders = { cur: 0, last: 0 }, 
    revenue = { cur: 0, last: 0 } 
  } = getDashboardDataByMonth(chartMonth);

  const { 
    onlineOrders = { cur: 0, last: 0 }, 
    offlineOrders = { cur: 0, last: 0 } 
  } = getOrderStatusByMonth(onlineMonth, offlineMonth);

  return (
    <div>
      <Title icon={<LayoutDashboard size={30}/>} title="DashBoard view" subtitle="Welcome back, here is what's happening today." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* revenue analytics */}
        <KeyMetric>
          <StatsCard
            headerTitle="Total Orders This Month"
            total={orders.cur}
            currentMonth={orders.cur}
            lastMonth={orders.last}
          />

          <StatsCard
            headerTitle="Revenue Overview"
            total={revenue.cur}
            currentMonth={revenue.cur}
            lastMonth={revenue.last}
          />
        </KeyMetric>

        <ChartCard title="Sales & Order Performance">
          <RevenueChart setChartMonth={setChartMonth} />
        </ChartCard>
        {/* online orders */}
        <KeyMetric>
          <StatsCard
            headerTitle="Online Orders Trend"
            total={onlineOrders.cur}
            currentMonth={onlineOrders.cur}
            lastMonth={onlineOrders.last}
          />
        </KeyMetric>

        <ChartCard title="Online Order analytics">
          <OnlineOrders setOnlineMonth={setOnlineMonth} />
        </ChartCard>
        {/* offline orders */}
        <ChartCard title="Offline Order analytics">
          <OfflineOrders setOfflineMonth={setOfflineMonth} />
        </ChartCard>

        <KeyMetric>
          <StatsCard
            headerTitle="Offline Orders Trend"
            total={offlineOrders.cur}
            currentMonth={offlineOrders.cur}
            lastMonth={offlineOrders.last}
          />
        </KeyMetric>

      </div>
    </div>
  )
}

export default DashBoard;

