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


const OfflineOrders : React.FC<{setOfflineMonth:React.Dispatch<React.SetStateAction<MonthKey>>}> = ({setOfflineMonth}) => {

const getSafeOffline = (month:any) => {
    const data = getMonthData(month);
    return data?.offline_orders || { cur: 0, last: 0 };
  };

  const data = [
    { month: "Jan", target: getSafeOffline("dec").last, revenue: getSafeOffline("jan").cur },
    { month: "Feb", target: getSafeOffline("jan").last, revenue: getSafeOffline("feb").cur },
    { month: "Mar", target: getSafeOffline("feb").last, revenue: getSafeOffline("mar").cur },
    { month: "Apr", target: getSafeOffline("mar").last, revenue: getSafeOffline("apr").cur },
    { month: "May", target: getSafeOffline("apr").last, revenue: getSafeOffline("may").cur },
    { month: "Jun", target: getSafeOffline("may").last, revenue: getSafeOffline("jun").cur },
    { month: "Jul", target: getSafeOffline("jun").last, revenue: getSafeOffline("jul").cur },
    { month: "Aug", target: getSafeOffline("jul").last, revenue: getSafeOffline("aug").cur },
    { month: "Sep", target: getSafeOffline("aug").last, revenue: getSafeOffline("sep").cur },
    { month: "Oct", target: getSafeOffline("sep").last, revenue: getSafeOffline("oct").cur },
    { month: "Nov", target: getSafeOffline("oct").last, revenue: getSafeOffline("nov").cur },
    { month: "Dec", target: getSafeOffline("nov").last, revenue: getSafeOffline("dec").cur },
  ];


  const maxValue = Math.max(...data.map(d => d.revenue), ...data.map(d => d.target));
console.log("maxvalue",maxValue);


const roundedMax = Math.ceil(maxValue / 1000) * 1000;

const handleBarClick = (month:any) => {
 
   setOfflineMonth(month.toLowerCase());
}

  return (
    <div>
      <ChartComponent
         pointClick={(args) => {
        const month = args.point.x;
        handleBarClick(month);
      }}
           id="offline-chart"
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
                  fill="#F59E0B"
                  border={{ width: 2, color: "#F59E0B" }}
                
                  
                />
      
             
                <SeriesDirective
                  type="Column"
                  dataSource={data}
                  xName="month"
                  yName="revenue"
                  name="Current Month"
                  columnWidth={0.45}
                  cornerRadius={{ topLeft: 6, topRight: 6 }}
                  fill="#F59E0B"
                
                />
       
      
              </SeriesCollectionDirective>
            </ChartComponent>
      
    </div>
  )
}

export default OfflineOrders
