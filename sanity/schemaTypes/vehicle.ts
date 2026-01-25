import { defineField, defineType } from 'sanity'

export const vehicle = defineType({
  name: 'vehicle',
  title: 'Vehicle',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Campervan', value: 'campervan' },
          { title: 'Motorhome', value: 'motorhome' },
          { title: 'Car', value: 'car' },
          { title: 'Caravan', value: 'caravan' },
        ],
      },
    }),
    defineField({
      name: 'make',
      title: 'Make',
      type: 'string',
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
    }),
    defineField({
      name: 'year',
      title: 'Year',
      type: 'number',
    }),
    defineField({
      name: 'fuelType',
      title: 'Fuel Type',
      type: 'string',
      options: {
        list: [
          { title: 'Petrol', value: 'petrol' },
          { title: 'Diesel', value: 'diesel' },
          { title: 'Electric', value: 'electric' },
          { title: 'Hybrid', value: 'hybrid' },
        ],
      },
    }),
    defineField({
      name: 'fuelConsumption',
      title: 'Fuel Consumption (L/100km)',
      type: 'number',
      description: 'Average fuel consumption in litres per 100 kilometres',
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
  ],
  preview: {
    select: {
      name: 'name',
      make: 'make',
      model: 'model',
      media: 'image',
    },
    prepare({ name, make, model, media }) {
      return {
        title: name,
        subtitle: make && model ? `${make} ${model}` : undefined,
        media,
      }
    },
  },
})
