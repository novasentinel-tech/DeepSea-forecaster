"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BrainCircuit } from "lucide-react";

interface ModelTrainingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
  onTrain: (fileId: string, type: 'lstm' | 'prophet', params: any) => void;
  isTraining: boolean;
}

export function ModelTrainingDialog({
  isOpen,
  onClose,
  fileId,
  onTrain,
  isTraining,
}: ModelTrainingDialogProps) {
  const [lstmParams, setLstmParams] = React.useState({
    lookback: 30,
    epochs: 100,
    batch_size: 32,
  });

  const [prophetParams, setProphetParams] = React.useState({
    quarterly_seasonality: true,
    yearly_seasonality: true,
    interval_width: 0.95,
  });

  const handleLstmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLstmParams({ ...lstmParams, [e.target.name]: parseInt(e.target.value) });
  };
  
  const handleTrain = (type: 'lstm' | 'prophet') => {
    const params = type === 'lstm' ? lstmParams : prophetParams;
    onTrain(fileId, type, params);
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Train a New Model</DialogTitle>
          <DialogDescription>
            Configure parameters for your time series model using file: {fileId}.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="lstm" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lstm">LSTM</TabsTrigger>
            <TabsTrigger value="prophet">Prophet</TabsTrigger>
          </TabsList>
          <TabsContent value="lstm" className="pt-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="lookback" className="text-right">
                  Lookback
                </Label>
                <Input id="lookback" name="lookback" type="number" value={lstmParams.lookback} onChange={handleLstmChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="epochs" className="text-right">
                  Epochs
                </Label>
                <Input id="epochs" name="epochs" type="number" value={lstmParams.epochs} onChange={handleLstmChange} className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="batch_size" className="text-right">
                  Batch Size
                </Label>
                <Input id="batch_size" name="batch_size" type="number" value={lstmParams.batch_size} onChange={handleLstmChange} className="col-span-3" />
              </div>
            </div>
            <DialogFooter>
                <Button onClick={() => handleTrain('lstm')} disabled={isTraining}>
                    <BrainCircuit className="mr-2 h-4 w-4" /> {isTraining ? 'Training...' : 'Train LSTM Model'}
                </Button>
            </DialogFooter>
          </TabsContent>
          <TabsContent value="prophet" className="pt-4">
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Quarterly Seasonality</Label>
                </div>
                <Switch checked={prophetParams.quarterly_seasonality} onCheckedChange={(c) => setProphetParams({...prophetParams, quarterly_seasonality: c})} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                    <Label>Yearly Seasonality</Label>
                </div>
                <Switch checked={prophetParams.yearly_seasonality} onCheckedChange={(c) => setProphetParams({...prophetParams, yearly_seasonality: c})} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4 mt-2">
                <Label htmlFor="interval_width" className="text-right col-span-2">
                  Interval Width
                </Label>
                <Input id="interval_width" name="interval_width" type="number" step="0.05" min="0" max="1" value={prophetParams.interval_width} onChange={(e) => setProphetParams({...prophetParams, interval_width: parseFloat(e.target.value)})} className="col-span-2" />
              </div>
            </div>
             <DialogFooter>
                <Button onClick={() => handleTrain('prophet')} disabled={isTraining}>
                    <BrainCircuit className="mr-2 h-4 w-4" /> {isTraining ? 'Training...' : 'Train Prophet Model'}
                </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
