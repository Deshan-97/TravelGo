'use server';

/**
 * @fileOverview An AI agent for suggesting hire prices based on historical and seasonal demand.
 *
 * - suggestHirePrice - A function that suggests a hire price for a vehicle.
 * - SuggestHirePriceInput - The input type for the suggestHirePrice function.
 * - SuggestHirePriceOutput - The return type for the suggestHirePrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestHirePriceInputSchema = z.object({
  vehicleType: z.string().describe('The type of vehicle being hired (e.g., sedan, SUV, truck).'),
  model: z.string().describe('The model of the vehicle.'),
  year: z.number().describe('The year the vehicle was manufactured.'),
  licensePlate: z.string().describe('The license plate number of the vehicle.'),
  serviceType: z.string().describe('The type of service being requested (e.g., airport transfer, wedding, tour).'),
  hireDurationDays: z.number().describe('The duration of the hire in days.'),
  timeOfYear: z.string().describe('The time of year the hire is taking place (e.g., Spring, Summer, Autumn, Winter).'),
  historicalDemand: z.string().describe('A description of the historical demand for this type of vehicle and service.'),
  currentMarketRates: z.string().describe('A description of the current market rates for similar vehicles and services.'),
});
export type SuggestHirePriceInput = z.infer<typeof SuggestHirePriceInputSchema>;

const SuggestHirePriceOutputSchema = z.object({
  suggestedPrice: z.number().describe('The suggested hire price in USD.'),
  reasoning: z.string().describe('The reasoning behind the suggested price.'),
});
export type SuggestHirePriceOutput = z.infer<typeof SuggestHirePriceOutputSchema>;

export async function suggestHirePrice(input: SuggestHirePriceInput): Promise<SuggestHirePriceOutput> {
  return suggestHirePriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestHirePricePrompt',
  input: {schema: SuggestHirePriceInputSchema},
  output: {schema: SuggestHirePriceOutputSchema},
  prompt: `You are an expert pricing consultant for vehicle hires. Given the following information, suggest a competitive and profitable hire price in USD, and explain your reasoning.\n\nVehicle Type: {{{vehicleType}}}\nModel: {{{model}}}\nYear: {{{year}}}\nLicense Plate: {{{licensePlate}}}\nService Type: {{{serviceType}}}\nHire Duration (Days): {{{hireDurationDays}}}\nTime of Year: {{{timeOfYear}}}\nHistorical Demand: {{{historicalDemand}}}\nCurrent Market Rates: {{{currentMarketRates}}}\n\nConsider seasonal demand and current market rates to suggest the best price.\n\nSuggested Price: 
Reasoning: `,
});

const suggestHirePriceFlow = ai.defineFlow(
  {
    name: 'suggestHirePriceFlow',
    inputSchema: SuggestHirePriceInputSchema,
    outputSchema: SuggestHirePriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
