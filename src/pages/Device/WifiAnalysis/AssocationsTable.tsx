import * as React from 'react';
import { Box, Flex, Heading, Spacer } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';
import { ParsedRadio } from './RadiosTable';
import { ColumnPicker } from 'components/DataTables/ColumnPicker';
import { DataTable } from 'components/DataTables/DataTable';
import DataCell from 'components/TableCells/DataCell';
import { Column } from 'models/Table';

export type ParsedAssociation = {
  radio?: ParsedRadio;
  ips: {
    ipv4: string[];
    ipv6: string[];
  };
  station: string;
  ssid: string;
  rssi: number | string;
  mode: string;
  rxBytes: number;
  rxRate: number;
  rxMcs: number | string;
  rxNss: number | string;
  txBytes: number;
  txRate: number;
  txMcs: number | string;
  txNss: number | string;
  recorded: number;
  dynamicVlan?: number;
};

type Props = {
  data?: ParsedAssociation[];
  ouis?: Record<string, string>;
  isSingle?: boolean;
};

const WifiAnalysisAssocationsTable = ({ data, ouis, isSingle }: Props) => {
  const { t } = useTranslation();
  const [hiddenColumns, setHiddenColumns] = React.useState<string[]>([]);

  const vendorCell = React.useCallback((v: string) => ouis?.[v] ?? '', [ouis]);
  const rightAlignedCell = React.useCallback(
    (v: string | number) => (
      <Box textAlign="right" pr={4}>
        {v}
      </Box>
    ),
    [],
  );
  const dataCell = React.useCallback((v: number) => <DataCell bytes={v} />, []);
  const indexCell = React.useCallback((assoc: ParsedAssociation) => assoc.radio?.band ?? assoc.radio?.deductedBand, []);

  const columns: Column<ParsedAssociation>[] = React.useMemo(
    (): Column<ParsedAssociation>[] => [
      {
        id: 'index',
        Header: '',
        Footer: '',
        accessor: 'radio.index',
        Cell: ({ cell }) => indexCell(cell.row.original) ?? '',
        customWidth: '35px',
        alwaysShow: true,
        disableSortBy: true,
      },
      {
        id: 'station',
        Header: t('controller.wifi.station'),
        Footer: '',
        accessor: 'station',
        customWidth: '35px',
        isMonospace: true,
        alwaysShow: true,
      },
      {
        id: 'vendor',
        Header: t('controller.wifi.vendor'),
        Footer: '',
        accessor: 'vendor',
        Cell: (v) => vendorCell(v.cell.row.original.station),
        customWidth: '35px',
        disableSortBy: true,
      },
      {
        id: 'dynamicVlan',
        Header: 'VLAN',
        Footer: '',
        Cell: (v) => (v.cell.row.original.dynamicVlan !== undefined ? `${v.cell.row.original.dynamicVlan}` : '-'),
        accessor: 'txBytes',
        customWidth: '35px',
      },
      {
        id: 'mode',
        Header: t('controller.wifi.mode'),
        Footer: '',
        accessor: 'mode',
        customWidth: '35px',
        disableSortBy: true,
      },
      {
        id: 'rssi',
        Header: 'RSSI',
        Footer: '',
        accessor: 'rssi',
        Cell: (v) => rightAlignedCell(v.cell.row.original.rssi),
        customWidth: '35px',
      },
      {
        id: 'rxRate',
        Header: t('controller.wifi.rx_rate'),
        Footer: '',
        accessor: 'rxRate',
        Cell: (v) => rightAlignedCell(v.cell.row.original.rxRate),
        customWidth: '35px',
      },
      {
        id: 'rx',
        Header: 'Rx',
        Footer: '',
        accessor: 'rxBytes',
        Cell: (v) => dataCell(v.cell.row.original.rxBytes),
        customWidth: '35px',
      },
      {
        id: 'rxMcs',
        Header: 'Rx MCS',
        Footer: '',
        accessor: 'rxMcs',
        Cell: (v) => rightAlignedCell(v.cell.row.original.rxMcs),
        customWidth: '35px',
      },
      {
        id: 'rxNss',
        Header: 'Rx NSS',
        Footer: '',
        accessor: 'rxNss',
        Cell: (v) => rightAlignedCell(v.cell.row.original.rxNss),
        customWidth: '35px',
      },
      {
        id: 'txRate',
        Header: t('controller.wifi.tx_rate'),
        Footer: '',
        accessor: 'txRate',
        Cell: (v) => rightAlignedCell(v.cell.row.original.txRate),
        customWidth: '35px',
      },
      {
        id: 'txBytes',
        Header: 'Tx',
        Footer: '',
        Cell: (v) => dataCell(v.cell.row.original.txBytes),
        accessor: 'txBytes',
        customWidth: '35px',
      },
    ],
    [t],
  );

  return (
    <>
      <Flex mt={2}>
        <Heading size="sm" my="auto">
          {isSingle ? 'Association' : `${t('devices.associations')} (${data?.length})`}
        </Heading>
        <Spacer />
        <ColumnPicker
          columns={columns as Column<unknown>[]}
          hiddenColumns={hiddenColumns}
          setHiddenColumns={setHiddenColumns}
          preference="gateway.device.analysis.associations.hiddenColumns"
          size="sm"
        />
      </Flex>
      <Box overflowX="auto" overflowY="auto" w="100%" maxH="300px">
        <DataTable
          columns={
            columns as {
              id: string;
              Header: string;
              Footer: string;
              accessor: string;
            }[]
          }
          hiddenColumns={hiddenColumns}
          data={data ?? []}
          hideEmptyListText
          sortBy={[{ id: 'index', desc: true }]}
          // @ts-ignore
          hideControls
          showAllRows
        />
      </Box>
    </>
  );
};

export default WifiAnalysisAssocationsTable;
