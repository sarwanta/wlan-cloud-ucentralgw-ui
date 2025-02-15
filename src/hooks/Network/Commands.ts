import { useToast } from '@chakra-ui/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { axiosGw } from 'constants/axiosInstances';
import { AxiosError } from 'models/Axios';

export type DeviceCommandHistory = {
  UUID: string;
  attachFile: number;
  command: string;
  completed: number;
  custom: number;
  details?: {
    uri?: string;
  };
  errorCode: number;
  errorText: string;
  executed: number;
  executionTime: number;
  results?: {
    serial?: string;
    uuid?: string;
    status?: {
      error?: number;
      result?: string;
    };
  };
  serialNumber: string;
  status: string;
  submitted: number;
  submittedBy: string;
  waitingForFile: number;
  when: number;
};

const getCommands = (limit: number, serialNumber?: string) => async () =>
  axiosGw
    .get(`commands?serialNumber=${serialNumber}&newest=true&limit=${limit}`)
    .then((response) => response.data) as Promise<{
    commands: DeviceCommandHistory[];
  }>;

export const useGetCommandHistory = ({
  serialNumber,
  limit,
  onError,
}: {
  serialNumber?: string;
  limit: number;
  onError?: (e: AxiosError) => void;
}) =>
  useQuery(['commands', serialNumber, { limit }], getCommands(limit, serialNumber), {
    keepPreviousData: true,
    enabled: serialNumber !== undefined && serialNumber !== '',
    staleTime: 30000,
    onError,
  });

const getCommandsBatch = (serialNumber?: string, start?: number, end?: number, limit?: number, offset?: number) =>
  axiosGw
    .get(`commands?serialNumber=${serialNumber}&startDate=${start}&endDate=${end}&limit=${limit}&offset=${offset}`)
    .then((response) => response.data) as Promise<{
    commands: DeviceCommandHistory[];
  }>;

const getCommandsByBatches = (serialNumber?: string, start?: number, end?: number) => async () => {
  let offset = 0;
  const limit = 100;
  let commands: DeviceCommandHistory[] = [];
  let latestResponse: {
    commands: DeviceCommandHistory[];
  };
  do {
    // eslint-disable-next-line no-await-in-loop
    latestResponse = await getCommandsBatch(serialNumber, start, end, limit, offset);
    commands = commands.concat(latestResponse.commands);
    offset += limit;
  } while (latestResponse.commands.length === limit);
  return {
    commands,
  };
};

export const useGetCommandHistoryWithTimestamps = ({
  serialNumber,
  start,
  end,
  onError,
}: {
  serialNumber?: string;
  start?: number;
  end?: number;
  onError?: (e: AxiosError) => void;
}) =>
  useQuery(['commands', serialNumber, { start, end }], getCommandsByBatches(serialNumber, start, end), {
    enabled: serialNumber !== undefined && serialNumber !== '' && start !== undefined && end !== undefined,
    staleTime: 1000 * 60,
    onError,
  });

const deleteCommandHistory = async (id: string) => axiosGw.delete(`command/${id}`);
export const useDeleteCommand = () => {
  const queryClient = useQueryClient();

  return useMutation(deleteCommandHistory, {
    onSuccess: () => {
      queryClient.invalidateQueries(['commands']);
    },
  });
};

export const useGetSingleCommandHistory = ({ serialNumber, commandId }: { serialNumber: string; commandId: string }) =>
  useQuery(
    ['commands', serialNumber, commandId],
    () =>
      axiosGw
        .get(`command/${commandId}?serialNumber=${serialNumber}`)
        .then((response) => response.data as DeviceCommandHistory),
    {
      enabled: serialNumber !== undefined && serialNumber !== '' && commandId !== undefined && commandId !== '',
    },
  );

export type EventQueueResponse = {
  UUID: string;
  attachFile: number;
  command: 'trace';
  completed: number;
  custom: number;
  details: {
    serial: string;
    types: string[];
  };
  errorCode: number;
  errorText: string;
  executed: number;
  executionTime: number;
  results: {
    serial: string;
    events: {
      dhcp: string[];
      wifi: string[];
    };
    status: {
      error: number;
      resultCode?: number;
      resultText?: string;
      text: string;
    };
  };
  serialNumber: string;
  status: string;
  submitted: number;
  submittedBy: string;
  waitingForFile: number;
  when: number;
};
const getEventQueue = async (serialNumber: string) =>
  axiosGw
    .post(`device/${serialNumber}/eventqueue`, {
      types: ['dhcp-snooping', 'wifi-frames'],
      serialNumber,
    })
    .then((response) => response.data as EventQueueResponse);
export const useGetEventQueue = () => {
  const queryClient = useQueryClient();

  return useMutation(getEventQueue, {
    onSuccess: () => {
      queryClient.invalidateQueries(['commands']);
    },
  });
};

const configureDevice = (serialNumber: string) => async (configuration: Record<string, unknown>) =>
  axiosGw.post<unknown>(`device/${serialNumber}/configure`, {
    when: 0,
    UUID: 1,
    serialNumber,
    configuration,
  });

export const useConfigureDevice = ({ serialNumber }: { serialNumber: string }) => {
  const queryClient = useQueryClient();

  return useMutation(configureDevice(serialNumber), {
    onSuccess: () => {
      queryClient.invalidateQueries(['commands', serialNumber]);
    },
  });
};

export type DeviceScriptCommand =
  | {
      serialNumber: string;
      deferred: true;
      type: 'shell' | 'bundle';
      timeout?: undefined;
      script: string;
      when: number;
      signature?: string;
      uri?: string;
    }
  | {
      serialNumber: string;
      deferred: false;
      type: 'shell' | 'bundle';
      timeout: number;
      script: string;
      when: number;
      signature?: string;
      uri?: string;
    };

export type DeviceScriptResponse = {
  UUID: string;
  attachFile: number;
  command: 'script';
  completed: number;
  custom: number;
  details: DeviceScriptCommand;
  errorCode: number;
  errorText: string;
  executed: number;
  executionTime: number;
  results: {
    serial: string;
    status: {
      error: number;
      resultCode: number;
      resultText: string;
      text: string;
    };
  };
  serialNumber: string;
  status: string;
  submitted: number;
  submittedBy: string;
  waitingForFile: number;
  when: number;
};

const startScript = (data: { serialNumber: string; timeout?: number; [k: string]: unknown }) =>
  axiosGw
    .post<DeviceScriptResponse>(`device/${data.serialNumber}/script`, data, {
      timeout: data.timeout ? data.timeout * 1000 + 10 : 5 * 60 * 1000,
    })
    .then((response: { data: DeviceCommandHistory }) => response.data);
export const useDeviceScript = ({ serialNumber }: { serialNumber: string }) => {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();

  return useMutation(startScript, {
    onSuccess: () => {
      queryClient.invalidateQueries(['commands', serialNumber]);
    },
    onError: (e) => {
      queryClient.invalidateQueries(['commands', serialNumber]);
      if (axios.isAxiosError(e)) {
        toast({
          id: 'script-error',
          title: t('common.error'),
          description: e?.response?.data?.ErrorDescription,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      }
    },
  });
};

const downloadScript = (serialNumber: string, commandId: string) =>
  axiosGw.get(`file/${commandId}?serialNumber=${serialNumber}`, { responseType: 'arraybuffer' });

export const useDownloadScriptResult = ({ serialNumber, commandId }: { serialNumber: string; commandId: string }) => {
  const { t } = useTranslation();
  const toast = useToast();

  return useQuery(['download-script', serialNumber, commandId], () => downloadScript(serialNumber, commandId), {
    enabled: false,
    onSuccess: (response) => {
      const blob = new Blob([response.data], { type: 'application/octet-stream' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      const headerLine =
        (response.headers['content-disposition'] as string | undefined) ??
        (response.headers['content-disposition'] as string | undefined);
      const filename = headerLine?.split('filename=')[1]?.split(',')[0] ?? `Script_${commandId}.tar.gz`;
      link.download = filename;
      link.click();
    },
    onError: (e) => {
      if (axios.isAxiosError(e)) {
        const bufferResponse = e.response?.data;
        let errorMessage = '';
        // If the response is a buffer, parse to JSON object
        if (bufferResponse instanceof ArrayBuffer) {
          const decoder = new TextDecoder('utf-8');
          const json = JSON.parse(decoder.decode(bufferResponse));
          errorMessage = json.ErrorDescription;
        }

        toast({
          id: `script-download-error-${serialNumber}`,
          title: t('common.error'),
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
          position: 'top-right',
        });
      }
    },
  });
};
