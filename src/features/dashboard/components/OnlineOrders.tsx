import { getMonthData } from "@/utils/dashboard";
import {
  ChartComponent,
  SeriesCollectionDirective,
  SeriesDirective,
  Inject,
  Category,
  Tooltip,
  DataLabel,
  Legend,
  ColumnSeries,
  SplineAreaSeries,
} from "@syncfusion/ej2-react-charts";
import React from "react";
import { MonthKey } from "../types";


const OnlineOrders:React.FC<{setOnlineMonth:React.Dispatch<React.SetStateAction<MonthKey>>}>= ({setOnlineMonth}) => {

  
const getSafeOnline = (month:any) => {
      const data = getMonthData(month);
    return data?.online_orders || { cur: 0, last: 0 };
  };

  const data = [
    { month: "Jan", target: getSafeOnline("dec").last, revenue: getSafeOnline("jan").cur },
    { month: "Feb", target: getSafeOnline("jan").last, revenue: getSafeOnline("feb").cur },
    { month: "Mar", target: getSafeOnline("feb").last, revenue: getSafeOnline("mar").cur },
    { month: "Apr", target: getSafeOnline("mar").last, revenue: getSafeOnline("apr").cur },
    { month: "May", target: getSafeOnline("apr").last, revenue: getSafeOnline("may").cur },
    { month: "Jun", target: getSafeOnline("may").last, revenue: getSafeOnline("jun").cur },
    { month: "Jul", target: getSafeOnline("jun").last, revenue: getSafeOnline("jul").cur },
    { month: "Aug", target: getSafeOnline("jul").last, revenue: getSafeOnline("aug").cur },
    { month: "Sep", target: getSafeOnline("aug").last, revenue: getSafeOnline("sep").cur },
    { month: "Oct", target: getSafeOnline("sep").last, revenue: getSafeOnline("oct").cur },
    { month: "Nov", target: getSafeOnline("oct").last, revenue: getSafeOnline("nov").cur },
    { month: "Dec", target: getSafeOnline("nov").last, revenue: getSafeOnline("dec").cur },
  ];


  const maxValue = Math.max(...data.map(d => d.revenue), ...data.map(d => d.target));


const roundedMax = Math.ceil(maxValue / 1000) * 1000;

const handleBarClick = (month:any) => {
 
  setOnlineMonth(month.toLowerCase());
}

  return (
    <div>
      <ChartComponent
          pointClick={(args) => {
        const month = args.point.x;
        handleBarClick(month);
      }}
              id="Order-status-chart"
              height="400px"
              primaryXAxis={{
                valueType: "Category",
                majorGridLines: { width: 0 },
                majorTickLines: { width: 0 },
                labelStyle: { color: "#6b7280", fontWeight: 600 },
                axisLine: { width: 0 },
                interval: 1,
              }}
              primaryYAxis={{
                minimum: 0,
                maximum: roundedMax,
                interval: roundedMax/4,
                labelFormat: "₹{value}k",
                lineStyle: { width: 0 },
                majorTickLines: { width: 0 },
                labelStyle: { color: "#9ca3af", fontWeight: 500 },
                majorGridLines: { color: "#f3f4f6", dashArray: "4,4" },
              }}
              chartArea={{ border: { width: 0 } }}
              tooltip={{
                enable: true,
                shared: true,
                header: "<b>${point.x} orders</b>",
                format: "${series.name}: <b>${point.y}</b>",
                fill: "#111827",
                textStyle: { color: "#ffffff" },
              }}
              legendSettings={{ visible: true, position: "Top", alignment: "Far" }}
            >
              <Inject
                services={[
                  ColumnSeries,
                  SplineAreaSeries,
                  Category,
                  DataLabel,
                  Tooltip,
                  Legend,
                ]}
              />
      
              <SeriesCollectionDirective>
      
                <SeriesDirective
                  type="SplineArea"
                  dataSource={data}
                  xName="month"
                  yName="target"
                  name="Last Month"
                  opacity={0.15}
                  fill="#22C55E"
                  border={{ width: 2, color: "#22C55E" }}
                
                  
                />
      
             
                <SeriesDirective
                  type="Column"
                  dataSource={data}
                  xName="month"
                  yName="revenue"
                  name="Current Month"
                  columnWidth={0.45}
                  cornerRadius={{ topLeft: 6, topRight: 6 }}
                  fill="#22C55E"
                
                />
       
      
              </SeriesCollectionDirective>
            </ChartComponent>
      
    </div>
  )
}

export default OnlineOrders
