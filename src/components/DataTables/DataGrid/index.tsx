import React from 'react';
import {
  Box,
  Center,
  Flex,
  HStack,
  Heading,
  LayoutProps,
  Spacer,
  Spinner,
  Table,
  TableContainer,
  Tbody,
  Thead,
  useColorModeValue,
} from '@chakra-ui/react';
import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { DataGridCellRow } from './CellRow';
import { DataGridColumnPicker } from './DataGridColumnPicker';
import { DataGridHeaderRow } from './HeaderRow';
import DataGridControls from './Input';
import { DataGridColumn, UseDataGridReturn } from './useDataGrid';
import { RefreshButton } from 'components/Buttons/RefreshButton';
import { LoadingOverlay } from 'components/LoadingOverlay';

export type ColumnOptions = {
  isSortable?: boolean;
};

export type DataGridOptions<TValue extends object> = {
  count?: number;
  isFullScreen?: boolean;
  isHidingControls?: boolean;
  isManual?: boolean;
  minimumHeight?: LayoutProps['minH'];
  onRowClick?: (row: TValue) => (() => void) | undefined;
  refetch?: () => void;
};

export type DataGridProps<TValue extends object> = {
  controller: UseDataGridReturn;
  columns: DataGridColumn<TValue>[];
  header: {
    title: string;
    objectListed: string;
    leftContent?: React.ReactNode;
    addButton?: React.ReactNode;
    otherButtons?: React.ReactNode;
  };
  data?: TValue[];
  isLoading?: boolean;
  options?: DataGridOptions<TValue>;
};

export const DataGrid = <TValue extends object>({
  controller,
  columns,
  header,
  data = [],
  options = {},
  isLoading = false,
}: DataGridProps<TValue>) => {
  const { t } = useTranslation();

  /*
    Table Styling
  */
  const textColor = useColorModeValue('gray.700', 'white');
  const hoveredRowBg = useColorModeValue('gray.100', 'gray.600');

  const minimumHeight: LayoutProps['minH'] = React.useMemo(() => {
    if (options.isFullScreen) {
      return { base: 'calc(100vh - 360px)', md: 'calc(100vh - 288px)' };
    }
    return options.minimumHeight ?? '300px';
  }, [options.isFullScreen, options.minimumHeight]);

  /*
    Table Options
  */
  const onRowClick = React.useMemo(() => options.onRowClick, [options.onRowClick]);

  const pagination = React.useMemo(
    () => ({
      pageIndex: controller.pageInfo.pageIndex,
      pageSize: controller.pageInfo.pageSize,
    }),
    [controller.pageInfo.pageIndex, controller.pageInfo.pageSize],
  );

  const pageCount = React.useMemo(() => {
    if (options.isManual && options.count) {
      return Math.ceil(options.count / pagination.pageSize);
    }
    return Math.ceil((data?.length ?? 0) / pagination.pageSize);
  }, [options.count, options.isManual, data?.length, pagination.pageSize]);

  const tableOptions = React.useMemo(
    () => ({
      pageCount: pageCount > 0 ? pageCount : 1,
      initialState: { sorting: controller.sortBy, pagination },
      manualPagination: options.isManual,
      manualSorting: options.isManual,
      autoResetPageIndex: false,
    }),
    [options.isManual, controller.sortBy, pageCount],
  );

  const table = useReactTable<TValue>({
    // react-table base functions
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),

    // Table State
    data,
    columns,
    state: {
      sorting: controller.sortBy,
      columnVisibility: controller.columnVisibility,
      pagination,
    },

    // Change Handlers
    onSortingChange: controller.setSortBy,
    onPaginationChange: controller.onPaginationChange,

    // debugTable: true,

    // Table Options
    ...tableOptions,
  });

  if (isLoading && data.length === 0) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <Box w="100%">
      <Flex mb={2}>
        <Heading size="md" my="auto" mr={2}>
          {header.title}
        </Heading>
        {header.leftContent}
        <Spacer />
        <HStack spacing={2}>
          {header.otherButtons}
          {header.addButton}
          <DataGridColumnPicker
            columns={columns}
            columnVisibility={controller.columnVisibility}
            setColumnVisibility={controller.setColumnVisibility}
            preference={`${controller.tableSettingsId}.hiddenColumns`}
          />
          {options.refetch ? <RefreshButton onClick={options.refetch} isCompact isFetching={isLoading} /> : null}
        </HStack>
      </Flex>
      <LoadingOverlay isLoading={isLoading}>
        <TableContainer minH={minimumHeight}>
          <Table size="small" textColor={textColor} w="100%" fontSize="14px">
            <Thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <DataGridHeaderRow<TValue> key={headerGroup.id} headerGroup={headerGroup} />
              ))}
            </Thead>
            <Tbody>
              {table.getRowModel().rows.map((row) => (
                <DataGridCellRow<TValue> key={row.id} row={row} onRowClick={onRowClick} rowStyle={{ hoveredRowBg }} />
              ))}
            </Tbody>
          </Table>
          {data?.length === 0 ? (
            <Center mt={8}>
              <Heading size="md">
                {header.objectListed ? t('common.no_obj_found', { obj: header.objectListed }) : t('common.empty_list')}
              </Heading>
            </Center>
          ) : null}
        </TableContainer>
      </LoadingOverlay>
      {!options.isHidingControls ? <DataGridControls table={table} isDisabled={isLoading} /> : null}
    </Box>
  );
};
